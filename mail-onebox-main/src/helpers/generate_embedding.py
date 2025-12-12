import sys
import json
from transformers import AutoModel

model_name = 'jinaai/jina-embeddings-v2-base-en'
model = AutoModel.from_pretrained(model_name, trust_remote_code=True)

def get_embedding(text):
    return model.encode(text).tolist()

if __name__ == "__main__":
    input_text = sys.argv[1]
    embedding = get_embedding(input_text)
    print(json.dumps(embedding))
