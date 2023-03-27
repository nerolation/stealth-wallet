import os
import time
from google.cloud import storage
import csv
from flask import jsonify, request

BUCKET_NAME = 'eip5564_data'
FILE_NAME = 'announcements.csv'
CACHE_DURATION = 15  # Cache duration in seconds

cache = {}
cache_expiration = 0

def csv_to_json(request):
    global cache, cache_expiration

    current_time = int(time.time())

    if current_time > cache_expiration:
        client = storage.Client()
        bucket = client.get_bucket(BUCKET_NAME)
        blob = storage.Blob(FILE_NAME, bucket)
        content = blob.download_as_text().splitlines()

        csv_reader = csv.DictReader(content)
        data = [row for row in csv_reader]

        cache = jsonify(data)
        cache.headers.set('Access-Control-Allow-Origin', '*')
        cache.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS, POST')
        cache_expiration = current_time + CACHE_DURATION

    return cache

