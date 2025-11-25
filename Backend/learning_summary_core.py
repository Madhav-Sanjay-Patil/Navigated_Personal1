# learning_summary_core.py

import re
import math
import json
from collections import Counter

import numpy as np
import torch

from bs4 import BeautifulSoup
import nltk
from nltk.stem import WordNetLemmatizer, PorterStemmer
from nltk.corpus import stopwords

from sentence_transformers import SentenceTransformer
from transformers import BertModel, BertTokenizer
from keybert import KeyBERT
from sklearn.cluster import KMeans


# ---- NLTK setup (same resources ma'am used) ----
# Run these once; in production you might pre-download.
nltk.download('stopwords', quiet=True)
nltk.download('wordnet', quiet=True)
nltk.download('punkt', quiet=True)

stop_words = set(stopwords.words('english'))


# ---- PREPROCESSING (same structure as utils_preprocess_text) ----

def utils_preprocess_text(text, flg_stemm=False, flg_lemm=True, lst_stopwords=None):
    # Remove HTML
    soup = BeautifulSoup(text, 'lxml')
    text = soup.get_text()

    # Remove punctuations and numbers
    text = re.sub('[^a-zA-Z]', ' ', text)

    # Single character removal
    text = re.sub(r"\s+[a-zA-Z]\s+", ' ', text)

    # Removing multiple spaces
    text = re.sub(r'\s+', ' ', text)

    # Tokenize
    lst_text = text.split()

    # Remove stopwords
    if lst_stopwords is not None:
        lst_text = [word for word in lst_text if word not in lst_stopwords]

    # Stemming
    if flg_stemm:
        ps = PorterStemmer()
        lst_text = [ps.stem(word) for word in lst_text]

    # Lemmatization
    if flg_lemm:
        lem = WordNetLemmatizer()
        lst_text = [lem.lemmatize(word) for word in lst_text]

    return " ".join(lst_text)


# ---- GLOBAL MODELS (same architecture ma'am used) ----

_sentence_model = SentenceTransformer('bert-base-nli-mean-tokens')
_kw_model = KeyBERT(model='all-mpnet-base-v2')
_bert_tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
_bert_model = BertModel.from_pretrained('bert-base-uncased')


# ---- KEYWORDS + EMBEDDINGS (KeyBERT + BERT) ----

def extract_keywords_for_text(text, num_keywords=10):
    """
    Given raw summary text, return (keyword_list, weight_list)
    using KeyBERT with same settings as notebook.
    """
    clean_text = utils_preprocess_text(
        text.lower(),
        flg_stemm=False,
        flg_lemm=True,
        lst_stopwords=stop_words
    )

    keywords = _kw_model.extract_keywords(
        clean_text,
        keyphrase_ngram_range=(1, 2),
        stop_words='english',
        use_mmr=True,
        diversity=0.5,
        highlight=False,
        top_n=num_keywords
    )

    keyword_list = list(dict(keywords).keys())
    weight_list = list(dict(keywords).values())
    return keyword_list, weight_list


def create_embeddings_for_keywords(keywords):
    """
    BERT [CLS] embeddings for each keyword.
    """
    if not keywords:
        return []

    tokenized_inputs = _bert_tokenizer(
        keywords,
        padding=True,
        truncation=True,
        return_tensors="pt"
    )

    with torch.no_grad():
        outputs = _bert_model(**tokenized_inputs)

    embeddings = outputs.last_hidden_state[:, 0, :].numpy()
    return embeddings.tolist()


def create_embeddings_centroid(embeddings, weights):
    """
    Weighted centroid of keyword embeddings, like create_embeddings_centroid_list.
    """
    if not embeddings:
        return []

    weighted_embeddings = []
    for emb, w in zip(embeddings, weights):
        weighted_embeddings.append([x * w for x in emb])

    centroid = [sum(x) / len(x) for x in zip(*weighted_embeddings)]
    return centroid


def heading_embedding_from_text(text):
    """
    Use first line of summary as 'heading' for SentenceTransformer embedding.
    """
    first_line = text.split('\n')[0]
    emb = _sentence_model.encode(first_line, convert_to_tensor=True)
    return emb.cpu().numpy().tolist()


def average_embeddings(emb1, emb2, num_keywords):
    """
    Same logic as your average_embeddings:
    (x + y * num_keywords) / (num_keywords + 1)
    """
    if not emb1:
        return emb2
    if not emb2:
        return emb1
    return [(x + y * num_keywords) / (num_keywords + 1) for x, y in zip(emb1, emb2)]


# ---- TOPIC POLYLINE (cosine similarity against topic embeddings) ----

def get_cos_sim(a, b):
    a = np.array(a)
    b = np.array(b)
    dot_product = float(np.dot(a, b))
    norm_a = float(np.linalg.norm(a))
    norm_b = float(np.linalg.norm(b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)


def create_polyline_for_embedding(embedding, topic_embeddings):
    """
    Same as create_polyline(final_embeddings):
    embedding -> list[{x: topic_index, y: scaled_cos_sim}]
    """
    polyline = []
    for j, topic_vec in enumerate(topic_embeddings):
        cos_sim = (get_cos_sim(topic_vec, embedding) + 1) / 2.0  # [0,1]
        polyline.append({'x': j, 'y': float(cos_sim)})
    return polyline


def polyline_to_array(polyline):
    """
    Convert [{x, y}, ...] to array of y-values (like get_polyline()).
    """
    return np.array([p['y'] for p in polyline], dtype=float)


def beta_scale_array(arr, beta=15.0):
    """
    Beta scaling used in notebook to increase variance.
    """
    if len(arr) == 0:
        return arr

    mean_val = np.average(arr)
    v2 = []
    for j in arr:
        jj = j + beta * (j - mean_val)
        if jj > 1:
            jj = 1
        if jj < 0:
            jj = 0
        v2.append(jj)
    return np.array(v2, dtype=float)


# ---- RADIAL PROJECTION TO 2D (rad_plot_axes + rad_plot_poly) ----

def rad_plot_axes(num, x_max=1.0, y_max=1.0):
    """
    Compute tlen and theta using same logic as rad_plot_axes in notebook.
    """
    empt_arr = []
    xstop = []
    ystop = []
    tlen = []
    ttempl = []
    theta = ((math.pi) / (num - 1)) / 2
    b = 0
    while (b * theta) <= (math.atan(y_max / x_max)):
        empt_arr.append(x_max * math.tan(b * theta))
        ystop.append(empt_arr[b])
        ttemp = math.sqrt(
            (x_max * x_max)
            + (x_max * math.tan(b * theta) * x_max * math.tan(b * theta))
        )
        tlen.append(ttemp)
        if (b * theta != math.atan(y_max / x_max)):
            ttempl.append(ttemp)
        b += 1

    while b < num:
        ystop.append(y_max)
        b += 1

    tlen.extend(list(reversed(ttempl)))
    xstop = list(reversed(ystop))
    # we don't need xstop for centroid, just tlen + theta
    return tlen, theta


def radial_centroid(poly_array, tlen, theta):
    """
    Convert 1D poly_array to x,y using same formula as rad_plot_poly centroid.
    """
    num = len(poly_array)
    if num == 0:
        return 0.0, 0.0

    x_values = []
    y_values = []
    for p in range(num):
        rlen = poly_array[p] * tlen[p]
        x_values.append(rlen * math.cos(p * theta))
        y_values.append(rlen * math.sin(p * theta))

    avg_x = sum(x_values) / num
    avg_y = sum(y_values) / num
    return float(avg_x), float(avg_y)


# ---- MAIN: SUMMARY -> POLYLINE + (x, y) ----

def summary_to_coordinates(summary_text, topic_embeddings, num_keywords=10, beta=15.0):
    """
    Take ONE learner summary text and topic_embeddings:
      - preprocess
      - keywords + weights
      - keyword embeddings + centroid
      - heading embedding
      - average -> final embedding
      - polyline vs topics
      - beta scaling
      - radial projection -> (x, y)
    Returns: (polyline_list_of_dicts, x, y)
    """

    # 1. keywords + weights
    kw_list, weight_list = extract_keywords_for_text(summary_text, num_keywords=num_keywords)

    # 2. keyword embeddings + centroid
    kw_emb = create_embeddings_for_keywords(kw_list)
    centroid_emb = create_embeddings_centroid(kw_emb, weight_list)

    # 3. heading embedding
    head_emb = heading_embedding_from_text(summary_text)

    # 4. combined embedding
    final_emb = average_embeddings(head_emb, centroid_emb, num_keywords)

    # 5. topic polyline
    polyline = create_polyline_for_embedding(final_emb, topic_embeddings)
    arr = polyline_to_array(polyline)
    beta_arr = beta_scale_array(arr, beta=beta)

    # 6. radial -> (x, y)
    num_topics = len(topic_embeddings)
    tlen, theta = rad_plot_axes(num_topics, 1, 1)
    x, y = radial_centroid(beta_arr, tlen, theta)

    return polyline, x, y


# ---- CLUSTERING + TOP-10 KEYWORDS (KMeans + Counter) ----

def cluster_summaries(poly_arrays, keywords_per_summary, opt_k=None):
    """
    poly_arrays: list of np.array (beta-scaled polyline arrays)
    keywords_per_summary: list of keyword lists (one per summary)
    opt_k: if None, compute with elbow method (same as notebook).
    Returns:
        labels: np.array of cluster labels (0..k-1)
        top_keywords: dict cluster_index -> list of top 10 keywords
    """
    from sympy.geometry import Point, Line

    before_learners = poly_arrays
    n = len(before_learners)
    if n == 0:
        # no summaries -> no clusters
        return np.array([]), {}

    # -------- choose opt_k (number of clusters) safely --------
    if opt_k is None:
        # If there is only ONE summary, only one cluster makes sense.
        if n == 1:
            opt_k = 1
        else:
            Sum_of_squared_distances = []
            K = range(1, n)  # same as your original: k = 1..n-1

            for k in K:
                km = KMeans(n_clusters=k, random_state=42)
                km = km.fit(before_learners)
                Sum_of_squared_distances.append(km.inertia_)

            # If for some reason we couldn't compute a proper curve,
            # fall back to a single cluster.
            if len(Sum_of_squared_distances) < 2:
                opt_k = 1
            else:
                # Elbow method: line between first and last SSE point,
                # choose k with max distance to this line.
                p1 = Point(1, Sum_of_squared_distances[0])
                p2 = Point(len(Sum_of_squared_distances),
                           Sum_of_squared_distances[-1])

                # Extra safety: if p1 == p2, the line is degenerate.
                if p1 == p2:
                    opt_k = 1
                else:
                    base_line = Line(p1, p2)
                    mx = 0.0
                    opt_k = 1
                    for i, sse in enumerate(Sum_of_squared_distances):
                        p = Point(i + 1, sse)
                        dist = base_line.distance(p)
                        if dist > mx:
                            mx = dist
                            opt_k = i + 1
    # -------- run KMeans with chosen opt_k --------
    km = KMeans(n_clusters=opt_k, random_state=42).fit(before_learners)
    labels = km.labels_

    # -------- Gather keywords per cluster --------
    cluster_kw = {i: [] for i in range(opt_k)}
    for lab, kws in zip(labels, keywords_per_summary):
        cluster_kw[lab].extend(kws)

    # -------- Top-10 via Counter (same as top_n_recurring_strings) --------
    top_keywords = {}
    for lab, kws in cluster_kw.items():
        counts = Counter(kws)
        top_keywords[lab] = [w for (w, _) in counts.most_common(10)]

    return labels, top_keywords
