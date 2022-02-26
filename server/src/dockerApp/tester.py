from ctypes import sizeof
from fileinput import filename
import sys
import os
import mysql.connector

dbConnection = mysql.connector.connect(
  host="host.docker.internal",
  user="root",
  password="password",
  database="hunter_db"
)

dbCursor = dbConnection.cursor()

def postResult():
    dbCursor.query

supported_langs = ["c", "cpp", "py", "js"]


if len(sys.argv) < 2:
    print('ERROR : language not specified, supported_langs = ["c", "cpp", "py", "js"]')
    exit()

filename = "app/code"
exefile = "app/build/code"
codeOutputfile = "app/files/output.txt"
codeInputfile = "app/files/input.txt"
language = (sys.argv[1])

if language not in supported_langs :
    print('ERROR : language ', language, ' not supported, supported_langs = ["c", "cpp", "py", "js"]')
    exit()

filename = filename+"."+language
processCode = 0

if not os.path.isfile(filename):
    print('ERROR : file ', filename, ' not found')
    exit()

if language == "c":
    compilationCode = os.system("gcc " + filename + " -o "+exefile)
    processCode = os.system( "timeout 5 ./" + exefile + " < "+ codeInputfile + " > " + codeOutputfile)

elif language == "cpp":
    compilationCode = os.system("g++ " + filename + " -o "+exefile)
    processCode = os.system( "timeout 5 ./" + exefile + " < "+ codeInputfile + " > " + codeOutputfile)

elif language == "py":
    processCode = os.system( "timeout 5 python3 " + filename + " < "+ codeInputfile + " > " + codeOutputfile)

print(processCode)
print("compiler said ",compilationCode)


codeOutput = open(codeOutputfile, "r")
correctOutput = open("app/files/ans.txt", "r")

for line in codeOutput.readlines():
    cLine = correctOutput.readline()

    line = line.replace("\n", "")
    cLine = cLine.replace("\n", "")

    if line != cLine:
        exit(1)

