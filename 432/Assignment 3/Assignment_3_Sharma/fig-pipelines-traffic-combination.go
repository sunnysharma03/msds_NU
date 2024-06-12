package main

import (
	"encoding/csv"
	"fmt"
	"log"
	"os"
)

func main() {
	// Open the CSV file
	file, err := os.Open("Traffic_Crashes_-_Crashes.csv")
	if err != nil {
		log.Fatal(err)
	}
	defer file.Close()

	// Create a CSV reader
	reader := csv.NewReader(file)

	// Read the CSV headers
	headers, err := reader.Read()
	if err != nil {
		log.Fatal(err)
	}

	// Find the index of the column we're interested in
	var columnIndex int
	for i, header := range headers {
		if header == "FIRST_CRASH_TYPE" { // Change this to "FIRST_CRASH_TYPE" if desired
			columnIndex = i
			break
		}
	}

	// Set to store unique values
	uniqueValues := make(map[string]struct{})

	// Read and process each row
	for {
		row, err := reader.Read()
		if err != nil {
			break
		}

		// Add the value of the column to the set of unique values
		uniqueValues[row[columnIndex]] = struct{}{}
	}

	// Print the unique values
	fmt.Println("Unique values of FIRST_CRASH_TYPE:")
	for value := range uniqueValues {
		fmt.Println(value)
	}
}
