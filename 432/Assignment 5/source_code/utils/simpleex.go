package utils


import (
	"database/sql"
	"fmt"
	"strings"

	_ "github.com/lib/pq"
)


var (
	Hostname = "localhost"
	Port     = 5433
	Username = "postgres"
	Password = "root"
	Database = "msds"
)

type MSDSCourse struct {
	CID string
	CNAME string 
	CPREREQ string
}


func openConnection() (*sql.DB, error) {
	// connection string
	conn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		Hostname, Port, Username, Password, Database)

	// open database
	db, err := sql.Open("postgres", conn)
	if err != nil {
		return nil, err
	}
	return db, nil
}

func AddCourse(d MSDSCourse){
	d.CNAME = strings.ToLower(d.CNAME)

	db, err := openConnection()
	if err != nil {
		fmt.Println(err)
	}
	defer db.Close()

	insertStatement := `insert into "msdscoursecatalog" ("cid","cname","cprereq") values ($1,$2,$3)`
	_, err = db.Exec(insertStatement, d.CID,d.CNAME,d.CPREREQ)
	if err != nil {
		fmt.Println(err)
	}
	
	fmt.Println("Course Added in msdscoursecatalog: ", d.CNAME)
}