import cv2
import face_recognition
from pynput.mouse import Controller

# Initialize the webcam
cap = cv2.VideoCapture(0)

# Initialize the mouse controller
mouse = Controller()

while True:
    ret, frame = cap.read()

    # Find face locations in the frame
    face_locations = face_recognition.face_locations(frame)

    for face_location in face_locations:
        # Draw rectangle around the face
        top, right, bottom, left = face_location
        cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)

        # Check head tilt and trigger scroll events
        if top < 200:
            # Head tilted up, trigger scroll up event
            mouse.scroll(0, 1)
            print('Head Tilted Up')
        elif bottom > 400:
            # Head tilted down, trigger scroll down event
            mouse.scroll(0, -1)
            print('Head Tilted Down')

    # Display the frame
    cv2.imshow("Head Tracking", frame)

    # Break the loop if 'q' key is pressed
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release the webcam and close all windows
cap.release()
cv2.destroyAllWindows()
