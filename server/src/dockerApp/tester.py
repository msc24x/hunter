from ctypes import sizeof
from fileinput import filename
import sys
import os
import mysql.connector

if len(sys.argv) < 2:
    print('ERROR : language not specified, supported_langs = ["c", "cpp", "py", "js"]')
    exit()

def postResult(code, message = ""):
    print(code)
    print(message)

supported_langs = ["c", "cpp", "py", "js"]


filename = "app/code"
exefile = "app/build/code"
codeOutputfile = "app/files/output.txt"
codeInputfile = "app/files/input.txt"
resultFile = "app/res.txt"
language = (sys.argv[1])

if language not in supported_langs :
    print('ERROR : language ', language, ' not supported, supported_langs = ["c", "cpp", "py", "js"]')
    exit()

filename = filename+"."+language
processCode = 0
compilationCode = 0
if not os.path.isfile(filename):
    print('ERROR : file ', filename, ' not found')
    exit()

if language == "c":
    compilationCode = os.system("gcc " + filename + " -o "+exefile + " 2> " + codeOutputfile)
    if compilationCode == 0:
        processCode = os.system( "timeout 5 ./" + exefile + " < "+ codeInputfile + " > " + codeOutputfile)

elif language == "cpp":
    compilationCode = os.system("g++ " + filename + " -o "+exefile + " 2> " + codeOutputfile)
    if compilationCode == 0:
        processCode = os.system( "timeout 5 ./" + exefile + " < "+ codeInputfile + " > " + codeOutputfile)

elif language == "py":
    processCode = os.system( "timeout 5 python3 " + filename + " < "+ codeInputfile + " > " + codeOutputfile)

codeOutput = open(codeOutputfile, "r")
codeOutput = codeOutput.readlines()
correctOutput = open("app/files/ans.txt", "r")

# Error while compilation
if compilationCode > 0:
    postResult(3, message = "\n".join(codeOutput))
    exit()
# Runtime error or timeout on 5sec
elif processCode == 15:
    postResult(4, message = "\n".join(codeOutput))
    exit()
elif processCode > 0:
    postResult(3, message = "\n".join(codeOutput))
    exit()


for line in codeOutput:
    cLine = correctOutput.readline()

    line = line.replace("\n", "")
    cLine = cLine.replace("\n", "")

    if line != cLine:
        postResult(2, message = "\n".join(codeOutput))
        exit()

postResult(1, message = "\n".join(codeOutput))
exit()

