import os
import time
import requests
from fastapi import HTTPException

DID_API_URL = "https://api.d-id.com/talks"

def get_did_headers() -> dict:
    api_key = os.getenv("DID_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="DID_API_KEY environment variable not set.")
    return {
        "accept": "application/json",
        "authorization": f"Basic {api_key}",
        "content-type": "application/json"
    }

def create_did_talk(script_text: str, source_url: str = "https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg") -> str:
    headers = get_did_headers()
    payload = {
        "script": {
            "type": "text",
            "input": script_text,
            "provider": {
                "type": "microsoft",
                "voice_id": "en-US-JennyNeural"
            }
        },
        "source_url": source_url,
        "config": {
            "fluent": "true",
            "pad_audio": "0.0"
        }
    }

    response = requests.post(DID_API_URL, json=payload, headers=headers)
    if response.status_code != 201:
        raise HTTPException(status_code=response.status_code, detail=f"D-ID API Error: {response.text}")

    return response.json().get("id")

def poll_did_talk_status(talk_id: str, max_retries: int = 30, delay: int = 5) -> str:
    headers = get_did_headers()
    status_url = f"{DID_API_URL}/{talk_id}"

    for _ in range(max_retries):
        response = requests.get(status_url, headers=headers)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch D-ID talk status.")

        data = response.json()
        status = data.get("status")

        if status == "done":
            return data.get("result_url")
        elif status in ["error", "rejected"]:
            raise HTTPException(status_code=500, detail=f"D-ID processing failed with status: {status}")

        time.sleep(delay)

    raise HTTPException(status_code=408, detail="D-ID video generation timed out.")