package utils

import (
	"encoding/csv"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

type MSDSCourse struct {
	CID        string
	CNAME      string
	CPREREQ    string
	LastAccess string
}

// JSONFILE resides in the current directory
var CSVFILE = "./dataMSDS.csv"

type MSDSCourseCatalog []MSDSCourse

var data = MSDSCourseCatalog{}
var index map[string]int

const PORT = ":1234"

func DefaultHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("Serving:", r.URL.Path, "from", r.Host)
	w.WriteHeader(http.StatusOK)
	Body := "Thanks for visiting!\n"
	fmt.Fprintf(w, "%s", Body)
}

func DeleteHandler(w http.ResponseWriter, r *http.Request) {
	// Get telephone
	paramStr := strings.Split(r.URL.Path, "/")
	fmt.Println("Path:", paramStr)
	if len(paramStr) < 3 {
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprintln(w, "Not found: "+r.URL.Path)
		return
	}

	log.Println("Serving:", r.URL.Path, "from", r.Host)

	CID := paramStr[2]
	err := DeleteEntry(CID)
	if err != nil {
		fmt.Println(err)
		Body := err.Error() + "\n"
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprintf(w, "%s", Body)
		return
	}
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "%s deleted!\n", CID)
}

func ListHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("Serving:", r.URL.Path, "from", r.Host)
	w.WriteHeader(http.StatusOK)
	Body := List()
	fmt.Fprintf(w, "%s", Body)
}

func StatusHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("Serving:", r.URL.Path, "from", r.Host)
	w.WriteHeader(http.StatusOK)
	Body := fmt.Sprintf("Total entries: %d\n", len(data))
	fmt.Fprintf(w, "%s", Body)
}

func InsertHandler(w http.ResponseWriter, r *http.Request) {
	// Split URL
	paramStr := strings.Split(r.URL.Path, "/")
	fmt.Println("Path:", paramStr)

	if len(paramStr) < 5 {
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprintln(w, "Not enough arguments: "+r.URL.Path)
		return
	}

	CID := paramStr[2]
	CNAME := paramStr[3]
	CPREREQ := paramStr[4]

	if CID == "" || CNAME == "" {
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprintln(w, "CID and CNAME must be specified.")
		return
	}

	course := InitS(CID, CNAME, CPREREQ)
	err := Insert(course)
	if err != nil {
		w.WriteHeader(http.StatusNotModified)
		fmt.Fprintln(w, "Failed to add course: ", err.Error())
		return
	} else {
		log.Println("Serving:", r.URL.Path, "from", r.Host)
		Body := "New record added successfully\n"
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, "%s", Body)
	}

	log.Println("Serving:", r.URL.Path, "from", r.Host)
}

func SearchHandler(w http.ResponseWriter, r *http.Request) {
	// Get Search value from URL
	paramStr := strings.Split(r.URL.Path, "/")
	fmt.Println("Path:", paramStr)

	if len(paramStr) < 3 {
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprintln(w, "Not found: "+r.URL.Path)
		return
	}

	var Body string
	CID := paramStr[2]
	course := Search(CID)
	if course == nil {
		w.WriteHeader(http.StatusNotFound)
		Body = "Could not be found: " + CID + "\n"
	} else {
		w.WriteHeader(http.StatusOK)
		Body = course.CID + " " + course.CNAME + " " + course.CPREREQ + "\n"
	}

	fmt.Println("Serving:", r.URL.Path, "from", r.Host)
	fmt.Fprintf(w, "%s", Body)
}


func ReadCSVFile(filepath string) error {
	_, err := os.Stat(filepath)
	if err != nil {
		return err
	}

	f, err := os.Open(filepath)
	if err != nil {
		return err
	}
	defer f.Close()

	// CSV file read all at once
	lines, err := csv.NewReader(f).ReadAll()
	if err != nil {
		return err
	}

	for _, line := range lines {
		temp := MSDSCourse{
			CID:        line[0],
			CNAME:      line[1],
			CPREREQ:    line[2],
			LastAccess: line[3],
		}
		// Storing to global variable
		data = append(data, temp)
	}

	return nil
}

func SaveCSVFile(filepath string) error {
	csvfile, err := os.Create(filepath)
	if err != nil {
		return err
	}
	defer csvfile.Close()

	csvwriter := csv.NewWriter(csvfile)
	for _, row := range data {
		temp := []string{row.CID, row.CNAME, row.CPREREQ, row.LastAccess}
		_ = csvwriter.Write(temp)
	}
	csvwriter.Flush()
	return nil
}

func CreateIndex() error {
	index = make(map[string]int)
	for i, k := range data {
		key := k.CID
		index[key] = i
	}
	return nil
}

// Initialized by the user – returns a pointer
// If it returns nil, there was an error
func InitS(CID, CNAME, CPREREQ string) *MSDSCourse {
	// Give LastAccess a value
	LastAccess := strconv.FormatInt(time.Now().Unix(), 10)
	return &MSDSCourse{CID: CID, CNAME: CNAME, CPREREQ: CPREREQ, LastAccess: LastAccess}
}

func Insert(course *MSDSCourse) error {
	// If it already exists, do not add it
	_, ok := index[course.CID]
	if ok {
		return fmt.Errorf("%s already exists", course.CID)
	}

	course.LastAccess = strconv.FormatInt(time.Now().Unix(), 10)
	data = append(data, *course)
	// Update the index
	_ = CreateIndex()

	err := SaveCSVFile(CSVFILE)
	if err != nil {
		return err
	}
	return nil
}

func DeleteEntry(CID string) error {
	i, ok := index[CID]
	if !ok {
		return fmt.Errorf("%s cannot be found!", CID)
	}
	data = append(data[:i], data[i+1:]...)
	// Update the index - key does not exist any more
	delete(index, CID)

	err := SaveCSVFile(CSVFILE)
	if err != nil {
		return err
	}
	return nil
}

func Search(CID string) *MSDSCourse {
	i, ok := index[CID]
	if !ok {
		return nil
	}
	data[i].LastAccess = strconv.FormatInt(time.Now().Unix(), 10)
	return &data[i]
}

func List() string {
	var all string
	for _, k := range data {
		all = all + k.CID + " " + k.CNAME + " " + k.CPREREQ + "\n"
	}
	return all
}