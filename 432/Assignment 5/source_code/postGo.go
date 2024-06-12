package main

import (
	"fmt"
	"math/rand"
	"time"
	"github.com/mactsouk/post05"
	"main.go/utils"
)

var MIN = 0
var MAX = 26

func random(min, max int) int {
	return rand.Intn(max-min) + min
}

func getString(length int64) string {
	startChar := "A"
	temp := ""
	var i int64 = 1
	for {
		myRand := random(MIN, MAX)
		newChar := string(startChar[0] + byte(myRand))
		temp = temp + newChar
		if i == length {
			break
		}
		i++
	}
	return temp
}

func AddDefaultCourses() {
    courses := []utils.MSDSCourse{
        {CID: "MSDS401", CNAME: "Applied Statistics with R", CPREREQ: "MSDS400"},
        {CID: "MSDS420", CNAME: "Database Systems", CPREREQ: "MSDS402"},
        {CID: "MSDS432", CNAME: "Foundations of Data Engineering", CPREREQ: "MSDS420"},
        {CID: "MSDS453", CNAME: "Natural Language Processing", CPREREQ: "MSDS422"},
        {CID: "MSDS498", CNAME: "Capstone Project", CPREREQ: "MSDS453"},
    }

    // Add each course individually
    for _, course := range courses {
        utils.AddCourse(course)
    }
}

func main() {
	post05.Hostname = "localhost"
	post05.Port = 5433
	post05.Username = "postgres"
	post05.Password = "root"
	post05.Database = "go"

	data, err := post05.ListUsers()
	if err != nil {
		fmt.Println(err)
		return
	}
	for _, v := range data {
		fmt.Println(v)
	}

	SEED := time.Now().Unix()
	rand.Seed(SEED)
	random_username := getString(5)

	t := post05.Userdata{
		Username:    random_username,
		Name:        "Mihalis",
		Surname:     "Tsoukalos",
		Description: "This is me!"}

	id := post05.AddUser(t)
	if id == -1 {
		fmt.Println("There was an error adding user", t.Username)
	}

	err = post05.DeleteUser(id)
	if err != nil {
		fmt.Println(err)
	}

	// Trying to delete it again!
	err = post05.DeleteUser(id)
	if err != nil {
		fmt.Println(err)
	}

	id = post05.AddUser(t)
	if id == -1 {
		fmt.Println("There was an error adding user", t.Username)
	}

	t = post05.Userdata{
		Username:    random_username,
		Name:        "Mihalis",
		Surname:     "Tsoukalos",
		Description: "This might not be me!"}

	err = post05.UpdateUser(t)
	if err != nil {
		fmt.Println(err)
	}


	// add msds course after running the create_tables_msds.sql file with psql
	AddDefaultCourses()

	// test := utils.MSDSCourse{CID:"rrrrr",CNAME:"rrrrr",CPREREQ:"ttttt"}
	// utils.AddCourse(test)
}
