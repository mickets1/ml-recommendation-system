import csv
import json
from elasticsearch import helpers, Elasticsearch
from dotenv import load_dotenv
import os

load_dotenv()

filenames = ["datasets/movies.csv", "datasets/ratings.csv", "datasets/users.csv"]
indexName = "docker"

def csv_reader(file):
    try:
        es = Elasticsearch(hosts=os.environ["host"],
        ssl_assert_fingerprint=(
            os.environ["ssl_assert_fingerprint"]
        ))

        with open(file, 'r') as outfile:
            reader = csv.DictReader(outfile, delimiter=';')
            helpers.bulk(es, reader, index=indexName)
    except Exception as e:
        print(e)

for file in filenames:
    csv_reader(file)