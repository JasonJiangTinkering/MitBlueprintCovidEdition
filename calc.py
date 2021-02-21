import cv2
from PIL import Image
from PIL import ImageStat
import math
import statistics
import time
import matplotlib.pyplot as plt
import matplotlib as mpl
import numpy as np

datapath = 'data/'

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
		im = newdict[xz[0]]
		c = 0
		a = 0
		im = im.convert('RGB')
		im.save('data/test.jpg')
		stat = ImageStat.Stat(im)
		r,g,b = stat.mean
		x = math.sqrt(0.241*(r**2) + 0.691*(g**2) + 0.068*(b**2))
		if len(helperlist) > 20:
			del helperlist[0]
		helperlist.append(x)
		hl2 = [j-i for i, j in zip(helperlist[:-1], helperlist[1:])]
		for x in hl2:
			if abs(x) > 2.5:
				c=c+1
		y = helperlist[len(helperlist)-1]
    	#if len(hl2) > 1:
    	#	std = statistics.stdev(hl2)
    	#else:
    	#	std = 0
    	#if std > 6:
    	#	print(name + ' is probably cheating')
		new.append([xz[0],a,helperlist,c])
	return(new)