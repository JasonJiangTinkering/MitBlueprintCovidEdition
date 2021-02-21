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

def brightness(im_file):
	im = Image.open(im_file)
	stat = ImageStat.Stat(im)
	r, g, b = stat.mean
	math.sqrt(0.241*(r**2) + 0.691*(g**2) + 0.068*(b**2))

def do(newdict,rounds,info,names):
    new = []
    for xz in info:
    	y = xz[3]
    	c = xz[2]
    	helperlist = xz[4]
    	im = newdict[xz[0]]
    	im = im.convert('RGB')
    	im.save('data/test.jpg')
    	a = 0
    	stat = ImageStat.Stat(im)
    	r,g,b = stat.mean
    	x = math.sqrt(0.241*(r**2) + 0.691*(g**2) + 0.068*(b**2))
    	helperlist.append(x)
    	if abs(x - y)>2:
    		c+=1
    	std = statistics.stdev(helperlist)
    	new.append([xz[0],a,c,x,helperlist,std])
    return(new) # new = [ NAME , 0 , 

