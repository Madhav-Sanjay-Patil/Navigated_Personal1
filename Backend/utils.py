import numpy as np
import math
import heapq


def convert_to_lists(data):
    if isinstance(data, np.ndarray):
        return data.tolist()
    elif isinstance(data, list):
        return [convert_to_lists(item) for item in data]
    elif isinstance(data, dict):
        return {key: convert_to_lists(value) for key, value in data.items()}
    else:
        return data


def get_lowline_of_polylines(polylines):
    if not polylines:
        return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

    lowline = [min([polylines[i][j] for i in range(len(polylines))])
               for j in range(len(polylines[0]))]
    return lowline


def get_highline_of_polylines(polylines):
    return [max([polylines[i][j] for i in range(len(polylines))])
            for j in range(len(polylines[0]))]


def get_cos_sim(a: np.ndarray, b: np.ndarray) -> float:
    """
    Calculate the cosine similarity between two vectors.

    Parameters:
        a (np.ndarray): First vector.
        b (np.ndarray): Second vector.

    Returns:
        float: Cosine similarity between the two vectors.
    """
    dot_product = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    return dot_product / (norm_a * norm_b)


def calculate_centroid(polylines):
    # Convert the list of polylines to a NumPy array for easier manipulation
    polyline_array = np.array(polylines)

    # Calculate the mean along the columns (axis=0)
    centroid = np.mean(polyline_array, axis=0)

    return centroid.tolist()


def two_polyline_distance(point1, point2):
    if len(point1) != len(point2):
        raise ValueError("Points must have the same dimensions")

    return math.sqrt(sum((p2 - p1) ** 2 for p1, p2 in zip(point1, point2)))


def nearest_seven(learner_polyline, resources_id_polylines):
    top7 = []
    for id_polyline in resources_id_polylines:
        distance = two_polyline_distance(learner_polyline, id_polyline[1])
        heapq.heappush(top7, (-distance, id_polyline[0]))
        if len(top7) > 7:
            heapq.heappop(top7)
    return [id[1] for id in top7]

def calculate_distance(pos1, pos2):
        return np.sqrt((pos1[0] - pos2[0]) ** 2 + (pos1[1] - pos2[1]) ** 2)

def is_valid_id(id):
    try:
        _ = int(id)
        return True
    except:
        return False