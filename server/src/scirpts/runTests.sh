#!/bin/sh

fileNumber=$1
fileType=$2
samples=$3
user_id=$4
tests=$5
sols=$6

docker cp "src/database/files/${fileNumber}_${user_id}.${fileType}" "hunterjudge:/app/code.${fileType}"

if [ $samples = true ];
then
        printf "${tests}" > temp.txt
        docker cp temp.txt hunterjudge:/app/files/input.txt
else
        docker cp "src/database/files/${fileNumber}_t.txt" "hubterjudge:/app/files/input.txt"
fi

if [ $samples = true ];
then
        printf $sols > temp.txt
        docker cp temp.txt hunterjudge:/app/files/ans.txt
else
        docker cp "src/database/files/${fileNumber}_s.txt" "hunterjudge:/app/files/ans.txt"
fi

docker exec -i hunterjudge python3 app/tester.py $fileType $samples