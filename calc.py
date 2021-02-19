import cv2
import socket
import sys
import pickle
import struct
from PIL import Image
from PIL import ImageStat
import math
import statistics
import time
import matplotlib.pyplot as plt
import matplotlib as mpl
import numpy as np

datapath = 'data/'

brightness_file = datapath+ 'brightness.data'
calibrated_file = datapath+ 'calibrated.data'

brightness_list = []
calibrated_list = []

f = open(brightness_file, 'w+')
c = open(calibrated_file, 'w+')

def brightness(im_file):
   im = Image.open(im_file)
   stat = ImageStat.Stat(im)
   r,g,b = stat.mean
   return math.sqrt(0.241*(r**2) + 0.691*(g**2) + 0.068*(b**2))

cascPath = "data/haarcascade_frontalface.xml"
faceCascade = cv2.CascadeClassifier(cascPath)

HOST=''
PORT=8089

s=socket.socket(socket.AF_INET,socket.SOCK_STREAM)
print ('Socket created')

s.bind((HOST,PORT))
print ('Socket bind complete')
s.listen(10)
print ('Socket now listening')

conn,addr=s.accept()

### new
data = b'' ### CHANGED
payload_size = struct.calcsize("L") ### CHANGED
t_end = time.time() + 5

while time.time() < t_end:

    while len(data) < payload_size:
        data += conn.recv(4096)
    packed_msg_size = data[:payload_size]
    data = data[payload_size:]
    msg_size = struct.unpack("L", packed_msg_size)[0]
    while len(data) < msg_size:
        data += conn.recv(4096)
    frame_data = data[:msg_size]
    data = data[msg_size:]

    # Capture frame-by-frame
    frame = pickle.loads(frame_data)

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Save the resulting frame
    ##if len(faces) != 0:
    cv2.imwrite(datapath + 'test.jpg', frame)
    x = brightness(datapath + 'test.jpg')
    calibrated_list.append(x)
    f.write(str(x)+'\n')

calibrated_std = statistics.pstdev(calibrated_list)
print(sum(calibrated_list)/len(calibrated_list))
print(calibrated_std)


y = 0
count = 0
movements = []
flags = []
starttime=time.time()
while True:

    # if int(time.sleep(60.0 - ((time.time() - starttime) % 60.0))) < 20 and z != '/':
    # 	count+=1
    #
    # else:
    # 	starttime=time.time()
    # 	print(count)
    # 	if count > 10:
    # 		print("cheating detected")
    # 		flags.append("flag")
    # 	else:
    # 		print("no cheating detected")
    # 		flags.append("clean")
    # 	count = 0

    # Capture frame-by-frame
    frame = pickle.loads(frame_data)
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Save the resulting frame
    ##if len(faces) != 0:
    cv2.imwrite(datapath + 'test.jpg', frame)
    x = brightness(datapath + 'test.jpg')
    brightness_list.append(x)
    f.write(str(x)+'\n')
    res = statistics.pstdev(brightness_list)
    print(x)
    if abs(x - y)>0.7:
    	if x-y>0:
    		z = "+"
    		movements.append("+")
    	else:
    		z = "-"
    		movements.append("-")
    else:
    	z = "/"
    	movements.append("/")
    y = x
    print(z)

mpl.use('tkagg')

plt.plot(calibrated_list)
plt.ylabel('brightness')
plt.show()

plt.plot(brightness_list)
plt.ylabel('brightness')
plt.show()

##from statsmodels.nonparametric.smoothers_lowess import lowess
##filtered = lowess(measurements, input_range, frac=0.05)

# When everything is done, release the capture
video_capture.release()
cv2.destroyAllWindows()
