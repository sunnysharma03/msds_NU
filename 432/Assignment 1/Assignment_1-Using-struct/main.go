package main

import (
	"encoding/csv"
	"fmt"
	"io"
	"os"
	"strconv"
	"strings"
	"time"
)

func main() {
	/*
	   Welcome to MSDS 432, DE with Go. This assignment introduces some basic concepts of using Go (Golang) for data work.
	   This assignment is designed to be easy to follow. Your primary goal will be to call functions and see Go in action
	   and for experimentation purposes you should change the years, months, and different passing parameters as per the data

	*/

	fmt.Println("\n\n ***********  ASSIGNMENT 1 - STARTING *********** \n\n")

	ALL_STRUCT_EX()

	fmt.Println("\n\n ***********  ASSIGNMENT 1 - ENDING *********** \n\n")

}

const TimeFormat = "1/2/2006 15:04"

type TrafficCrashes struct {
	CRASH_RECORD_ID               string
	RD_NO                         string
	CRASH_DATE_EST_I              string
	CRASH_DATE                    time.Time
	POSTED_SPEED_LIMIT            int
	TRAFFIC_CONTROL_DEVICE        string
	DEVICE_CONDITION              string
	WEATHER_CONDITION             string
	LIGHTING_CONDITION            string
	FIRST_CRASH_TYPE              string
	TRAFFICWAY_TYPE               string
	LANE_CNT                      int
	ALIGNMENT                     string
	ROADWAY_SURFACE_COND          string
	ROAD_DEFECT                   string
	REPORT_TYPE                   string
	CRASH_TYPE                    string
	INTERSECTION_RELATED_I        string
	NOT_RIGHT_OF_WAY_I            string
	HIT_AND_RUN_I                 string
	DAMAGE                        string
	DATE_POLICE_NOTIFIED          time.Time
	PRIM_CONTRIBUTORY_CAUSE       string
	SEC_CONTRIBUTORY_CAUSE        string
	STREET_NO                     int
	STREET_DIRECTION              string
	STREET_NAME                   string
	BEAT_OF_OCCURRENCE            int
	PHOTOS_TAKEN_I                string
	STATEMENTS_TAKEN_I            string
	DOORING_I                     string
	WORK_ZONE_I                   string
	WORK_ZONE_TYPE                string
	WORKERS_PRESENT_I             string
	NUM_UNITS                     int
	MOST_SEVERE_INJURY            string
	INJURIES_TOTAL                int
	INJURIES_FATAL                int
	INJURIES_INCAPACITATING       int
	INJURIES_NON_INCAPACITATING   int
	INJURIES_REPORTED_NOT_EVIDENT int
	INJURIES_NO_INDICATION        int
	INJURIES_UNKNOWN              int
	CRASH_HOUR                    int
	CRASH_DAY_OF_WEEK             int
	CRASH_MONTH                   int
	LATITUDE                      float64
	LONGITUDE                     float64
	LOCATION                      string
	E_Day_of_Week                 string
	E_ZIP_CODE                    string
}

func ALL_STRUCT_EX() {
	//this function will hold all of the calls to answer all questions using structs
	//read the data
	//call the ReadData function from the code_struct package
	//Add function here

	// mystruct_data := ReadData(`../Data/Traffic_Crashes_Mini_Dataset.csv`)

	//uncomment this line to run on the large dataset
	mystruct_data := ReadData(`../Data/Traffic_Crashes_-_Crashes.csv`)

	//1. Print a report showing the total crashes during in the year 2020
	//call the CrashesInYear function from the code_struct package. Make sure to use the correct arguments
	// After running the code with year 2020, look at the data and find which years does it have and then change the code to test for few other years
	//Add function here

	question_1 := CrashesInYear(mystruct_data, 2021)

	fmt.Println("\n\n***********  STRUCT READ - QUESTION 1 - Total crashes during in the year 2020 ***********\n\n")

	fmt.Println(question_1)

	fmt.Println("\n\n***********  STRUCT READ - QUESTION 1 ENDS ***********\n\n")

	//2. Print a report to show the number of crashes for every Day of the Week for Year 2021
	//call the CrashesDOW function from the code_struct package. Make sure to use the correct arguments
	// After running the code with year 2020, look at the data and find which years does it have and then change the code to test for few other years
	//Add function here

	question_2 := CrashesDOW(mystruct_data, "m", "2020")

	fmt.Println("\n\n***********  STRUCT READ - QUESTION 2 - Number of crashes for every Day of the Week for Year 2021 ***********\n\n")

	fmt.Println(question_2)

	fmt.Println("\n\n***********  STRUCT READ - QUESTION 2 ENDS ***********\n\n")

	//3. Print a report to show the total number of crashes reported grouped by PRIM_CONTRIBUTORY_CAUSE for the month of December in the year 2020
	//call the TotalCrashesGrouped function from the code_struct package.. Make sure to use the correct arguments
	// After running the code with year 2020, look at the data and find which years does it have and then change the code to test for few other years
	//Add function here

	question_3 := TotalCrashesGrouped(mystruct_data, "11", "2021")

	fmt.Println("\n\n***********  STRUCT READ - QUESTION 3 - Total number of crashes reported grouped by PRIM_CONTRIBUTORY_CAUSE ***********\n\n")

	fmt.Println(question_3)

	fmt.Println("\n\n***********  STRUCT READ - QUESTION 3 ENDS ***********\n\n")

	//4. Print a report to show the total number of HIT_AND_RUN_I grouped by ROADWAY_SURFACE_COND for the month of December in the year 2020
	//call the HitNRun function from the code_struct package.. Make sure to use the correct arguments
	// After running the code with year 2020, look at the data and find which years does it have and then change the code to test for few other years
	//Add function here

	question_4 := HitNRun(mystruct_data, "Y", "11", "2021")

	fmt.Println("\n\n ***********  STRUCT READ - QUESTION 4 - Total number of HIT_AND_RUN_I grouped by ROADWAY_SURFACE_COND *********** \n\n")

	fmt.Println(question_4)

	fmt.Println("\n\n ***********  STRUCT READ - QUESTION 4 ENDS *********** \n\n")

}

func ReadData(filepath string) []TrafficCrashes {
	//this function will read in the target data with a struct
	var TempStruct []TrafficCrashes

	file, err := os.Open(filepath)
	if err != nil {
		fmt.Println(err) //replace with log
	}
	defer file.Close()
	MyReader := csv.NewReader(file)
	MyReader.FieldsPerRecord = -1
	//loop over records and append
	//For missing string values use M
	//missing dates use 1901-01-01
	//missing floats use 12.34567890
	//missing ints use -6
	row := 0
	var RecordSlice TrafficCrashes
	for {
		record, err := MyReader.Read()
		if err == io.EOF {
			break
		}

		if row == 0 {
			row += 1
			continue
		} else {

			for i, val := range record {
				ValType := fmt.Sprintf("%T", val)

				switch i {
				case 0:
					if ValType != "string" {
						val = "M"
					}
					RecordSlice.CRASH_RECORD_ID = val
				case 1:
					if ValType != "string" {
						val = "M"
					}
					RecordSlice.RD_NO = val
				case 2:
					if ValType != "string" {
						val = "M"
					}
					RecordSlice.CRASH_DATE_EST_I = val
				case 3:
					timeParsed, err := time.Parse(TimeFormat, val)
					if err != nil {
						fmt.Println(err)
						timeParsed = time.Date(1901, time.January, 01, 0, 0, 0, 0, time.UTC)
					}
					RecordSlice.CRASH_DATE = timeParsed
				case 4:
					intParsed, err := strconv.ParseInt(val, 0, 0)
					if err != nil {

					}
					RecordSlice.POSTED_SPEED_LIMIT = int(intParsed)
				case 5:
					if ValType != "string" {
						val = "M"
					}
					RecordSlice.TRAFFIC_CONTROL_DEVICE = val
				case 6:
					if ValType != "string" {
						val = "M"
					}
					RecordSlice.DEVICE_CONDITION = val
				case 7:
					if ValType != "string" {
						val = "M"
					}
					RecordSlice.WEATHER_CONDITION = val
				case 8:
					if ValType != "string" {
						val = "M"
					}
					RecordSlice.LIGHTING_CONDITION = val
				case 9:
					if ValType != "string" {
						val = "M"
					}
					RecordSlice.FIRST_CRASH_TYPE = val
				case 10:
					if ValType != "string" {
						val = "M"
					}
					RecordSlice.TRAFFICWAY_TYPE = val
				case 11:
					intParsed, err := strconv.ParseInt(val, 0, 0)
					if err != nil {
						intParsed = -6
					}
					RecordSlice.LANE_CNT = int(intParsed)
				case 12:
					if ValType != "string" {
						val = "M"
					}
					RecordSlice.ALIGNMENT = val
				case 13:
					if ValType != "string" {
						val = "M"
					}
					RecordSlice.ROADWAY_SURFACE_COND = val
				case 14:
					if ValType != "string" {
						val = "M"
					}
					RecordSlice.ROAD_DEFECT = val
				case 15:
					if ValType != "string" {
						val = "M"
					}
					RecordSlice.REPORT_TYPE = val
				case 16:
					if ValType != "string" {
						val = "M"
					}
					RecordSlice.CRASH_TYPE = val
				case 17:
					if ValType != "string" {
						val = "M"
					}
					RecordSlice.INTERSECTION_RELATED_I = val
				case 18:
					if ValType != "string" {
						val = "M"
					}
					RecordSlice.NOT_RIGHT_OF_WAY_I = val
				case 19:
					if ValType != "string" {
						val = "M"
					}
					RecordSlice.HIT_AND_RUN_I = val
				case 20:
					if ValType != "string" {
						val = "M"
					}
					RecordSlice.DAMAGE = val
				case 21:
					timeParsed, err := time.Parse(TimeFormat, val)
					if err != nil {
						timeParsed = time.Date(1901, time.January, 01, 0, 0, 0, 0, time.UTC)
					}
					RecordSlice.DATE_POLICE_NOTIFIED = timeParsed
				case 22:
					if ValType != "string" {
						val = "M"
					}
					RecordSlice.PRIM_CONTRIBUTORY_CAUSE = val
				case 23:
					if ValType != "string" {
						val = "M"
					}
					RecordSlice.SEC_CONTRIBUTORY_CAUSE = val
				case 24:
					intParsed, err := strconv.ParseInt(val, 0, 0)
					if err != nil {
						intParsed = -6
					}
					RecordSlice.STREET_NO = int(intParsed)
				case 25:
					if ValType != "string" {
						val = "M"
					}
					RecordSlice.STREET_DIRECTION = val
				case 26:
					if ValType != "string" {
						val = "M"
					}
					RecordSlice.STREET_NAME = val
				case 27:
					intParsed, err := strconv.ParseInt(val, 0, 0)
					if err != nil {
						intParsed = -6
					}
					RecordSlice.BEAT_OF_OCCURRENCE = int(intParsed)
				case 28:
					if ValType != "string" {
						val = "M"
					}
					RecordSlice.PHOTOS_TAKEN_I = val
				case 29:
					if ValType != "string" {
						val = "M"
					}
					RecordSlice.STATEMENTS_TAKEN_I = val
				case 30:
					if ValType != "string" {
						val = "M"
					}
					RecordSlice.DOORING_I = val
				case 31:
					if ValType != "string" {
						val = "M"
					}
					RecordSlice.WORK_ZONE_I = val
				case 32:
					if ValType != "string" {
						val = "M"
					}
					RecordSlice.WORK_ZONE_TYPE = val
				case 33:
					if ValType != "string" {
						val = "M"
					}
					RecordSlice.WORKERS_PRESENT_I = val
				case 34:
					intParsed, err := strconv.ParseInt(val, 0, 0)
					if err != nil {
						intParsed = -6
					}
					RecordSlice.NUM_UNITS = int(intParsed)
				case 35:
					if ValType != "string" {
						val = "M"
					}
					RecordSlice.MOST_SEVERE_INJURY = val
				case 36:
					intParsed, err := strconv.ParseInt(val, 0, 0)
					if err != nil {
						intParsed = -6
					}
					RecordSlice.INJURIES_TOTAL = int(intParsed)
				case 37:
					intParsed, err := strconv.ParseInt(val, 0, 0)
					if err != nil {
						intParsed = -6
					}
					RecordSlice.INJURIES_FATAL = int(intParsed)
				case 38:
					intParsed, err := strconv.ParseInt(val, 0, 0)
					if err != nil {
						intParsed = -6
					}
					RecordSlice.INJURIES_INCAPACITATING = int(intParsed)
				case 39:
					intParsed, err := strconv.ParseInt(val, 0, 0)
					if err != nil {
						intParsed = -6
					}
					RecordSlice.INJURIES_NON_INCAPACITATING = int(intParsed)
				case 40:
					intParsed, err := strconv.ParseInt(val, 0, 0)
					if err != nil {
						intParsed = -6
					}
					RecordSlice.INJURIES_REPORTED_NOT_EVIDENT = int(intParsed)
				case 41:
					intParsed, err := strconv.ParseInt(val, 0, 0)
					if err != nil {
						intParsed = -6
					}
					RecordSlice.INJURIES_NO_INDICATION = int(intParsed)
				case 42:
					intParsed, err := strconv.ParseInt(val, 0, 0)
					if err != nil {
						intParsed = -6
					}
					RecordSlice.INJURIES_UNKNOWN = int(intParsed)
				case 43:
					intParsed, err := strconv.ParseInt(val, 0, 0)
					if err != nil {
						intParsed = -6
					}
					RecordSlice.CRASH_HOUR = int(intParsed)
				case 44:
					intParsed, err := strconv.ParseInt(val, 0, 0)
					if err != nil {
						intParsed = -6
					}
					RecordSlice.CRASH_DAY_OF_WEEK = int(intParsed)
				case 45:
					intParsed, err := strconv.ParseInt(val, 0, 0)
					if err != nil {
						intParsed = -6
					}
					RecordSlice.CRASH_MONTH = int(intParsed)
				case 46:
					floatParsed, err := strconv.ParseFloat(val, 64)
					if err != nil {
						floatParsed = 41.881832 //defaulting to the center of chicago according to https://www.latlong.net/place/chicago-il-usa-1855.html#:~:text=Latitude%20and%20longitude%20coordinates%20are%3A%2041.881832%2C%20-87.623177.%20Famous,most%20multi-cultural%20and%20multi-national%20communities%20in%20the%20country.
					}
					RecordSlice.LATITUDE = floatParsed
				case 47:
					floatParsed, err := strconv.ParseFloat(val, 64)
					if err != nil {
						floatParsed = -87.623177 //defaulting to the center of chicago according to https://www.latlong.net/place/chicago-il-usa-1855.html#:~:text=Latitude%20and%20longitude%20coordinates%20are%3A%2041.881832%2C%20-87.623177.%20Famous,most%20multi-cultural%20and%20multi-national%20communities%20in%20the%20country.
					}
					RecordSlice.LONGITUDE = floatParsed
				case 48:
					if ValType != "string" {
						val = "M"
					}
					RecordSlice.LOCATION = val

				}
			}

			//add weekday for the current record
			RecordSlice.E_Day_of_Week = RecordSlice.CRASH_DATE.Weekday().String()

		}

		TempStruct = append(TempStruct, RecordSlice)
		row += 1

	}
	return TempStruct
}

func CrashesInYear(data []TrafficCrashes, year int) map[int]int {
	//This function takes in a string for the year
	//uusing this string, this function will print the total crashes
	//for the provided year.
	//Because I know the column index of the value I want, I do not need to add any additional validation
	//This is not how you should do it in practice as this may hurt your data integrity

	//first, copy your data from the orginal. This will isolate any changes
	mytempdata := data
	//next, we want to see how many crashes there were in a given year. So we will have to see which year we are aiming for.
	//I will use a map[string]int to hold our values.
	crashcount := map[int]int{year: 0}
	//looping over the resluts may be the easiest way to get a quick count.
	//Being that we are dealing with all string values, I will have to either parse out the target string or convert the string to a data type of time.
	//FOR EXTRA POINTS TRY CONVERTING THE STRING TO A DATA TYPE OF TIME
	for i, row := range mytempdata {
		if i != 0 {
			//get the index related to the crash year
			//parse out the year value from the date index.
			if row.CRASH_DATE.Year() == year {
				crashcount[year] += 1
			}
		}
	}

	return crashcount
}

func CrashesDOW(data []TrafficCrashes, freq, year string) map[string]int {
	//this function will take in some data, a frequency, and target year.
	//Valid freq inputs are d and w, where d will give daily counts 1-365 and w will give day name counts Mon-Sun
	//first, copy your data from the orginal. This will isolate any changes
	//I will return a map with the counts
	mycrashdata := make(map[string]int)
	mytempdata := data
	//we will first use a switch to handle the different inputs for freq.
	switch strings.ToLower(freq) {
	case "d":
		//this is the total crashes for every day of a year.
		for i, row := range mytempdata {
			if i != 0 { //this is making sure we are not looking at the column headers for data
				//get the index related to the crash year
				if fmt.Sprintf("%d", row.CRASH_DATE.Year()) == year { //This is a lazy way to convert ints to strings. You should not use this method in production
					mycrashdata[fmt.Sprintf("%d", row.CRASH_DATE.YearDay())] += 1
				}
			}
		}
	case "m":
		//this is the total crashes for every named day of the year
		for i, row := range mytempdata {
			if i != 0 { //this is making sure we are not looking at the column headers for data
				//get the index related to the crash year
				if fmt.Sprintf("%d", row.CRASH_DATE.Year()) == year { //This is a lazy way to convert ints to strings. You should not use this method in production
					mycrashdata[row.CRASH_DATE.Weekday().String()] += 1
				}
			}
		}
	default:
		fmt.Println("Please use a valid freq input. Your options are d or m")
	}

	return mycrashdata
}

func TotalCrashesGrouped(data []TrafficCrashes, month, year string) map[string]int {
	//This function takes in some data and group the total counts by the provide col for the target month and year
	//first, copy your data from the orginal. This will isolate any changes
	//I will return a map with the counts
	mycrashdata := make(map[string]int)
	mytempdata := data

	//loop over data and try to get our groups and results
	for i, row := range mytempdata {
		if i != 0 { //this is making sure we are not looking at the column headers for data
			//get the index related to the crash year
			if fmt.Sprintf("%d", row.CRASH_DATE.Year()) == year && (row.CRASH_DATE.Month().String() == month || fmt.Sprintf("%d", row.CRASH_DATE.Month()) == month) { //This is a lazy way to convert ints to strings. You should not use this method in production
				mycrashdata[row.PRIM_CONTRIBUTORY_CAUSE] += 1
			}
		}
	}
	return mycrashdata
}

func HitNRun(data []TrafficCrashes, filter_qual, month, year string) map[string]int {
	//This function takes some data, a filtering column and will provide the total crashes where the filtering column matches the filtering qual
	//first, copy your data from the orginal. This will isolate any changes
	//I will return a map with the counts
	mycrashdata := make(map[string]int)
	mytempdata := data

	//loop over data and try to get our groups and results
	for i, row := range mytempdata {
		if i != 0 { //this is making sure we are not looking at the column headers for data
			//get the index related to the crash year
			if fmt.Sprintf("%d", row.CRASH_DATE.Year()) == year && (row.CRASH_DATE.Month().String() == month || fmt.Sprintf("%d", row.CRASH_DATE.Month()) == month) { //This is a lazy way to convert ints to strings. You should not use this method in production
				if strings.ToLower(row.HIT_AND_RUN_I) == strings.ToLower(strings.TrimSpace(filter_qual)) {
					mycrashdata[row.ROADWAY_SURFACE_COND] += 1
				} else {
					continue
				}

			}
		}
	}

	return mycrashdata
}
