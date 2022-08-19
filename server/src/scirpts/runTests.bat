@echo off
set fileNumber=%1
set fileType=%2
set samples=%3
set user_id=%4
set tests=%5
set sols=%6


docker cp "src/database/files/%fileNumber%_%user_id%.%fileType%" "elated_yalow:/app/code.%fileType%"

if %samples%==true (
    printf %tests% > temp.txt
    docker cp temp.txt elated_yalow:/app/files/input.txt
) else (
    docker cp "src/database/files/%fileNumber%_t.txt" "elated_yalow:/app/files/input.txt"
)

if %samples%==true (
    printf %sols% > temp.txt
    docker cp temp.txt elated_yalow:/app/files/ans.txt
) else (
    docker cp "src/database/files/%fileNumber%_s.txt" "elated_yalow:/app/files/ans.txt"
)

docker exec -i elated_yalow python3 app/tester.py %fileType% %samples%
