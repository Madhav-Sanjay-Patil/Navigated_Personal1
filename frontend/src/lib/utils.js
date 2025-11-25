// This utility file provides functions for making HTTP requests using the configured Axios instance (api). 
// It includes getResponsePost, getResponseGet, getResponseDelete, and getResponsePut for different HTTP methods, 
// handling potential 404 errors by clearing local storage and reloading. The syncUserIds function fetches and stores
// learner, teacher, and TA IDs. A getWordCount function calculates the number of words in a string.
// import React from "react";
import api from "./axios";

export const syncUserIds = async () => {
    const user_id = localStorage.getItem('id');
    if (!user_id) return;
    const response = await api.get('/ids/' + user_id);
    localStorage.setItem("learner_id", response.data.learner_id);
    localStorage.setItem("teacher_id", response.data.teacher_id);
    localStorage.setItem("ta_id", response.data.ta_id);
}

export const getResponsePost = async (url, data, headers) => {
    try {
        const response = await api.post(url, data, {
            headers: headers,
        });
        return response;
    } catch (err) {
        if (err.response?.status === 404) {
            localStorage.clear();
            window.location.reload();
        }
        return err;
    }
};

export const getResponseGet = async (url, headers, params) => {
    try {
        const response = await api.get(url, {
            headers,
            params
        });
        return response;
    } catch (err) {
        if (err.response?.status === 404) {
        }
        return err;
    }
};

export const getResponseDelete = async (url, headers) => {
    try {
        const response = await api.delete(url, {
            headers: headers,
        });
        return response;
    } catch (err) {
        return err;
    }
};

export const getResponsePut = async (url, data, headers) => {
    try {
        const response = await api.put(url, JSON.stringify(data), {
            headers: headers,
        });
        return response;
    } catch (err) {
        return err;
    }
};

export const getWordCount = (str) => {
    return str === null
        ? 0 : str.split(/\s+/).filter(word => word.length > 0).length
};
