"""Corpus-fitted TF-IDF cosine retrieval, with no external packages."""
import json
import math
import re
import sys
from collections import Counter

def tokens(text):
    return Counter(re.findall(r"[^\W_]+", text.casefold()))

def rank(query, docs):
    corpus = [tokens(doc["text"]) for doc in docs]
    frequency = Counter(word for document in corpus for word in document)
    weights = {word: math.log((1 + len(docs)) / (1 + count)) + 1 for word, count in frequency.items()}
    def vector(document):
        return {word: count * weights[word] for word, count in document.items() if word in weights}
    def norm(v):
        return math.sqrt(sum(value * value for value in v.values()))
    q = vector(tokens(query))
    results = []
    for doc, counts in zip(docs, corpus):
        d = vector(counts)
        score = sum(value * d.get(word, 0) for word, value in q.items()) / (norm(q) * norm(d) or 1)
        if score > 0:
            results.append((score, doc["id"]))
    return [key for _, key in sorted(results, reverse=True)[:3]]
if __name__ == "__main__":
    payload = json.load(sys.stdin)
    print(json.dumps(rank(payload["query"], payload["docs"])))
