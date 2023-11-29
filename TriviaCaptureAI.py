import cv2
from PIL import Image
import os
import base64
import requests
import time

# Add your OpenAI API Key here
OPENAI_API_KEY = "YOUR_API_KEY"

# Function to encode the image to base64
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

# Function to analyze image with OpenAI API
def analyze_image(image_path):
    base64_image = encode_image(image_path)

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENAI_API_KEY}"
    }

    payload = {
        "model": "gpt-4-vision-preview",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "There is trivia question in this image. What is the answer?"
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}",
                            "detail": "high"
                        }
                    }
                ]
            }
        ],
        "max_tokens": 300
    }

    start_time = time.time()
    response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
    end_time = time.time()

    duration = end_time - start_time
    print(f"Response received in {duration:.2f} seconds")
    response_json = response.json()
    if 'choices' in response_json and len(response_json['choices']) > 0:
        content = response_json['choices'][0].get('message', {}).get('content', 'No answer found')
        print(content)
    else:
        print("No answer found")
        print(response_json)
        
def resize_image(input_path, output_path, size=(800, 600)):
    with Image.open(input_path) as img:
        img = img.resize(size, Image.Resampling.LANCZOS)
        img.save(output_path, optimize=True, quality=85)

# Function to capture and crop image
def capture_and_crop_image(save_directory, camera_index):
    cap = cv2.VideoCapture(camera_index, cv2.CAP_AVFOUNDATION)

    if not cap.isOpened():
        print(f"Could not open camera index {camera_index}")
        return

    print(f"Camera {camera_index} started. Press Spacebar to capture and analyze an image, or 'q' to quit.")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to capture image")
            break

        cv2.imshow('frame', frame)

        key = cv2.waitKey(1)
        if key == 32:  # Spacebar
            cv_image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            width, height = cv_image.size
            left = width * 0.2
            right = width * 0.8

            cropped_image = cv_image.crop((left, 0, right, height))
            cropped_image_path = os.path.join(save_directory, f"cropped_image_{camera_index}.png")
            cropped_image.save(cropped_image_path)

            resized_image_path = os.path.join(save_directory, f"resized_image_{camera_index}.png")
            resize_image(cropped_image_path, resized_image_path)

            print(f"Saved and resized image to {resized_image_path}")

            analyze_image(resized_image_path)  # Analyze the resized image
        elif key == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

def main():
    save_directory = "captured_images"
    if not os.path.exists(save_directory):
        os.makedirs(save_directory)

    for camera_index in range(3):
        capture_and_crop_image(save_directory, camera_index)

main()