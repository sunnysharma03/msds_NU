# Updated Notes: 
## Date: 7 feb 2023


The following changes must be made in order for this assignment to run smoothly

| Change      | Outcome |
| ----------- | ----------- |
|Remove or delete the provided folder named **postgres**.| This will remove any errors when trying to build your container. This will also allow you to pull a fresh image from dockerhub.|
|Run **ALL PROVIDED COMMANDS** in admin mode.| This will get over any issues with psql not being added to your path. This may only impact windows users.|
|Run **go run postGo.go** in a new terminal within vs code| By doing this you will remove the need for rebuilding your mod and sum files.|
|Use "C:\Program Files\PostgreSQL\13\bin\psql" -h localhost -p 5433 -U postgres -f "full path to file//create_tables.sql"|This will point to the sql file and uses the psql -f for filename|