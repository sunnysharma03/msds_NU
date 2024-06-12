package main

import (
	"encoding/json"
	"fmt"
	"math/rand"
)

// MSDSCourse represents an MSDS course
type MSDSCourse struct {
	CID     string `json:"course_id"`
	CNAME   string `json:"course_name"`
	CPREREQ string `json:"prerequisite"`
}

func main() {
	// Array to store 5 MSDS courses
	var CourseArray [5]MSDSCourse

	// Slice to store 5 MSDS courses
	var CourseSlice []MSDSCourse

	// Map to store 5 MSDS courses
	var CourseMap map[string]MSDSCourse
	CourseMap = make(map[string]MSDSCourse)

	// Adding courses to the data structures
	for i := 0; i < 5; i++ {
		course := MSDSCourse{
			CID:     fmt.Sprintf("Course ID: %d", i+1),
			CNAME:   fmt.Sprintf("MSDS %d", (i+1)*100+rand.Intn(100)),
			CPREREQ: fmt.Sprintf("MSDS %d", (i+1)*50+rand.Intn(50)),
		}

		// Adding course to the array
		CourseArray[i] = course

		// Adding course to the slice
		CourseSlice = append(CourseSlice, course)

		// Adding course to the map
		key := fmt.Sprintf("Course #%d", i+1)
		CourseMap[key] = course
	}

	// Convert MSDS courses to JSON format
	CourseArrayJson, _ := json.MarshalIndent(&CourseArray, "", "  ")
	CourseSliceJson, _ := json.MarshalIndent(&CourseSlice, "", "  ")
	CourseMapJson, _ := json.MarshalIndent(&CourseMap, "", "  ")

	// Print JSON outputs
	fmt.Println("Course Json from Array:")
	fmt.Println(string(CourseArrayJson))

	fmt.Println("\nCourse Json from Slice:")
	fmt.Println(string(CourseSliceJson))

	fmt.Println("\nCourse Json from Map:")
	fmt.Println(string(CourseMapJson))
}
