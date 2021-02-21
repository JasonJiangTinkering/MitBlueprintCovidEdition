import cv2
from PIL import Image
from PIL import ImageStat
import math
import statistics
import time
import matplotlib.pyplot as plt
import matplotlib as mpl
import numpy as np
from mtcnn.mtcnn import MTCNN
from matplotlib import pyplot
import os, logging

#os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
#logging.getLogger("tensorflow").setLevel(logging.CRITICAL)
#logging.getLogger("tensorflow_hub").setLevel(logging.CRITICAL)
#import tensorflow as tf


datapath = 'data/'
#detector = MTCNN()
def do(newdict,info,names):
    new = []
    for i in range(0, len(info)):
    	xz = info[i]
    	try:
    		name = names[i]
    	except:
    		break
    	try:
    		helperlist = xz[2]
    	except:
    		break
    	try:
    		im = newdict[xz[0]]
    	except:
    		break
    	c = 0
    	a = 0
    	im = im.convert('RGB')
    	im.save('data/test.jpg')
    	#filename = 'data/test.jpg'
    	#pixels = pyplot.imread('data/test.jpg')
    	#faces = detector.detect_faces(pixels)
    	#z = len(faces)
    	#print(z)
    	z = 0
    	stat = ImageStat.Stat(im)
    	r,g,b = stat.mean
    	x = math.sqrt(0.241*(r**2) + 0.691*(g**2) + 0.068*(b**2))
    	if len(helperlist) > 20:
    		del helperlist[0]
    	helperlist.append(x)
    	hl2 = [j-i for i, j in zip(helperlist[:-1], helperlist[1:])]
    	for x in hl2:
    		if abs(x) > 0.8:
    			c=c+1
    	y = helperlist[len(helperlist)-1]
    	#if len(hl2) > 1:
    	#	std = statistics.stdev(hl2)
    	#else:
    	#	std = 0
    	#if std > 6:
    	#	print(name + ' is probably cheating')
    	new.append([xz[0],a,helperlist,c,z])
    return(new)


def get_eye_locations():
	x1, y1, width, height = result['box']
	x2, y2 = x1 + width, y1 + height
	# extract face
	face = data[y1:y2, x1:x2]
	# load the image
	data = pyplot.imread(filename)
	# plot each face as a subplot
	for i in range(len(result_list)):
		# get coordinates
		x1, y1, width, height = result_list[i]['box']
		x2, y2 = x1 + width, y1 + height
		# define subplot
		pyplot.subplot(1, len(result_list), i+1)
		pyplot.axis('off')
		# plot face
		pyplot.imshow(data[y1:y2, x1:x2])
	# show the plot
	pyplot.show()

