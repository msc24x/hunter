from ctypes import sizeof
from fileinput import filename
import sys
import os


samples = 'false'

if len(sys.argv) < 3:
    print('ERROR : language not specified, supported_langs = ["c", "cpp", "py", "js"]')
    exit()

def postResult(code, message = ""):
  print(code , " - " , codeMsg[code])
  print(message)
  os.system("truncate -s 0 "+codeOutputfile)
  exit()


supported_langs = ["c", "cpp", "py", "js"]


filename = "app/code"
exefile = "app/build/code"
codeOutputfile = "app/files/output.txt"
codeInputfile = "app/files/input.txt"
resultFile = "app/res.txt"
language = sys.argv[1]
samples = sys.argv[2]

codeMsg = {
  1 : "Accepted",
  2 : "Wrong Answer",
  3 : "Compilation Error",
  4 : "Timeout",
  5 : "Runtime Error"
}

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
      processCode = os.system( "timeout 5 ./" + exefile + " < "+ codeInputfile + " 2>> " + codeOutputfile+ " 1>> " + codeOutputfile)

elif language == "cpp":
  compilationCode = os.system("g++ " + filename + " -o "+exefile + " 2> " + codeOutputfile)
  if compilationCode == 0:
      processCode = os.system( "timeout 5 ./" + exefile + " < "+ codeInputfile  + " 2>> " + codeOutputfile+ " 1>> " + codeOutputfile)

elif language == "py":
    processCode = os.system( "timeout 5 python3 " + filename + " < "+ codeInputfile  + " 2>> " + codeOutputfile+ " 1>> " + codeOutputfile)

elif language == "js":
  processCode = os.system( "timeout 5 node " + filename + " < "+ codeInputfile  + " 2>> " + codeOutputfile+ " 1>> " + codeOutputfile)

codeOutput = open(codeOutputfile, "r")
codeOutputLines = codeOutput.readlines()
codeOutput.seek(0,0)
correctOutput = open("app/files/ans.txt", "r")
correctOutputLines = correctOutput.readlines()
correctOutput.seek(0,0)

# Error while compilation
if compilationCode > 0:
  postResult(3, message = "".join(codeOutputLines))
  
# Runtime error or timeout on 5sec
elif processCode == 15:
  postResult(4, message = "")
  
elif processCode > 0:
  postResult(5, message = "".join(codeOutputLines))
  


for cLine in correctOutputLines:
  line = codeOutput.readline()

  line = line.replace("\n", "")
  cLine = cLine.replace("\n", "")

  if line != cLine:
    if samples == 'true':
      postResult(2, message = "".join(codeOutputLines))
    else:
      postResult(2, message = "")
      
    
if samples == 'true':
  postResult(1, message = "".join(codeOutputLines))
else:
  postResult(1, message = "")


