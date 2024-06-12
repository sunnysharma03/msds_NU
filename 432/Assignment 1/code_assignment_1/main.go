package main

import (
	"code_assignment_1/code_csv"
	"code_assignment_1/code_gota"
	"code_assignment_1/code_struct"
	"fmt"
)

func main() {
	/*

	   Welcome to MSDS 432, DE with Go. This assignment introduces some basic concepts of using Go (Golang) for data work.
	   This assignment is designed to be easy to follow. Your primary goal will be to call functions and see Go in action
	   and for experimentation purposes you should change the years, months, and different passing parameters as per the data

	*/

	fmt.Println("\n\n ***********  ASSIGNMENT 1 - STARTING *********** \n\n")

	All_CSV_EX()
	ALL_STRUCT_EX()
	ALL_GOTA_EX()

	fmt.Println("\n\n ***********  ASSIGNMENT 1 - ENDING *********** \n\n")

}

func All_CSV_EX() {
	//this function will hold all of the calls to answers all questions using a csv reader
	//read the data
	//call the ReadData function from the code_csv package
	//Add function here

	// mycsvdata := code_csv.ReadData(`../DATA/Traffic_Crashes_-_Crashes.csv`)
	mycsvdata := code_csv.ReadData(`../DATA/Traffic_Crashes_Mini_Dataset.csv`)

	// after running with large data set change it to Traffic_Crashes_Mini_Dataset.csv
	// doing that will result in a parsing error, find the solution, fix the code, and explain why it was failing and how you fixed it.

	//1. Print a report showing the total crashes during in the year 2020
	// After running the code with year 2020, look at the data and find which years does it have and then change the code to test for few other years
	// call the CrashesInYear function from the code_csv package. Make sure to use the correct arguments
	// Add function here

	question_1 := code_csv.CrashesInYear(mycsvdata, "2020")

	fmt.Println("\n\n *********** CSV READ - QUESTION 1 - Total crashes during in the year 2020 *********** \n\n")

	fmt.Println(question_1)

	fmt.Println("\n\n *********** CSV READ - QUESTION 1 ENDS *********** \n\n")

	//2. Print a report to show the number of crashes for every Day of the Week for Year 2021
	//call the CrashesDOW function from the code_csv package. Make sure to use the correct arguments
	//same as in the above experiment, change it for other years, months, and days for experimentation with the code
	//Add function here

	question_2 := code_csv.CrashesDOW(mycsvdata, "m", "2021")

	fmt.Println("\n\n *********** CSV READ - QUESTION 2 - Number of crashes for every Day of the Week for Year 2021 *********** \n\n")

	fmt.Println(question_2)

	fmt.Println("\n\n *********** CSV READ -  QUESTION 2 ENDS *********** \n\n")

	//3. Print a report to show the total number of crashes reported grouped by PRIM_CONTRIBUTORY_CAUSE for the month of December in the year 2020
	//call the TotalCrashesGrouped function from the code_csv package. Make sure to use the correct arguments
	//same as in the above experiment, change it for other years, months, and days for experimentation with the code
	//Add function here

	question_3 := code_csv.TotalCrashesGrouped(mycsvdata, "PRIM_CONTRIBUTORY_CAUSE", "12", "2020")

	fmt.Println("\n\n *********** CSV READ -  QUESTION 3 - Total number of crashes reported grouped by PRIM_CONTRIBUTORY_CAUSE *********** \n\n")

	fmt.Println(question_3)

	fmt.Println("\n\n ***********  CSV READ - QUESTION 3 ENDS *********** \n\n")

	//8. Print a report to show the total number of HIT_AND_RUN_I grouped by ROADWAY_SURFACE_COND for the month of December in the year 2020
	//call the HitNRun function from the code_csv package. Make sure to use the correct arguments
	//same as in the above experiment, change it for other years, months, and days for experimentation with the code
	//Add function here

	question_4 := code_csv.HitNRun(mycsvdata, "HIT_AND_RUN_I", "Y", "ROADWAY_SURFACE_COND", "12", "2020")

	fmt.Println("\n\n ***********  CSV READ - QUESTION 4 - Total number of HIT_AND_RUN_I grouped by ROADWAY_SURFACE_COND *********** \n\n")

	fmt.Println(question_4)

	fmt.Println("\n\n ***********  CSV READ - QUESTION 4 ENDS *********** \n\n")
}

func ALL_STRUCT_EX() {
	//this function will hold all of the calls to answer all questions using structs
	//read the data
	//call the ReadData function from the code_struct package
	//Add function here

	// mystruct_data := code_struct.ReadData(`../DATA/Traffic_Crashes_-_Crashes.csv`)
	mystruct_data := code_struct.ReadData(`../DATA/Traffic_Crashes_Mini_Dataset.csv`)

	// after running with large data set change it to Traffic_Crashes_Mini_Dataset.csv
	// doing that will result in a parsing error, find the solution, fix the code, and explain why it was failing and how you fixed it.

	//5. Print a report showing the total crashes during in the year 2020
	//call the CrashesInYear function from the code_struct package. Make sure to use the correct arguments
	//same as in the above experiment, change it for other years, months, and days for experimentation with the code
	//Add function here

	question_1 := code_struct.CrashesInYear(mystruct_data, 2020)

	fmt.Println("\n\n ***********  STRUCT READ - QUESTION 1 - Total crashes during in the year 2020 *********** \n\n")

	fmt.Println(question_1)

	fmt.Println("\n\n ***********  STRUCT READ - QUESTION 1 ENDS *********** \n\n")

	//6. Print a report to show the number of crashes for every Day of the Week for Year 2021
	//call the CrashesDOW function from the code_struct package. Make sure to use the correct arguments
	//same as in the above experiment, change it for other years, months, and days for experimentation with the code
	//Add function here

	question_2 := code_struct.CrashesDOW(mystruct_data, "m", "2021")

	fmt.Println("\n\n ***********  STRUCT READ - QUESTION 2 - Number of crashes for every Day of the Week for Year 2021 *********** \n\n")

	fmt.Println(question_2)

	fmt.Println("\n\n ***********  STRUCT READ - QUESTION 2 ENDS *********** \n\n")

	//3. Print a report to show the total number of crashes reported grouped by PRIM_CONTRIBUTORY_CAUSE for the month of December in the year 2020
	//call the TotalCrashesGrouped function from the code_struct package.. Make sure to use the correct arguments
	//same as in the above experiment, change it for other years, months, and days for experimentation with the code
	//Add function here

	question_3 := code_struct.TotalCrashesGrouped(mystruct_data, "12", "2020")

	fmt.Println("\n\n ***********  STRUCT READ - QUESTION 3 - Total number of crashes reported grouped by PRIM_CONTRIBUTORY_CAUSE *********** \n\n")

	fmt.Println(question_3)

	fmt.Println("\n\n ***********  STRUCT READ - QUESTION 3 ENDS *********** \n\n")

	//4. Print a report to show the total number of HIT_AND_RUN_I grouped by ROADWAY_SURFACE_COND for the month of December in the year 2020
	//call the HitNRun function from the code_struct package.. Make sure to use the correct arguments
	//same as in the above experiment, change it for other years, months, and days for experimentation with the code
	//Add function here

	question_4 := code_struct.HitNRun(mystruct_data, "Y", "12", "2020")

	fmt.Println("\n\n ***********  STRUCT READ - QUESTION 4 - Total number of HIT_AND_RUN_I grouped by ROADWAY_SURFACE_COND *********** \n\n")

	fmt.Println(question_4)

	fmt.Println("\n\n ***********  STRUCT READ - QUESTION 4 ENDS *********** \n\n")

}

func ALL_GOTA_EX() {
	//this function will hold all of the calls to answer all questions using dataframes from gota
	//read the data
	//call the ReadData function from the code_gota package
	//Add function here
	// mydataframe := code_gota.ReadData(`../DATA/Traffic_Crashes_-_Crashes.csv`)
	mydataframe := code_gota.ReadData(`../DATA/Traffic_Crashes_Mini_Dataset.csv`)

	// after running with large data set change it to Traffic_Crashes_Mini_Dataset.csv
	// doing that will result in a parsing error, find the solution, fix the code, and explain why it was failing and how you fixed it.

	//1. Print a report showing the total crashes during in the year 2020
	//call the CrashesInYear function from the code_gota package. Make sure to use the correct arguments
	//same as in the above experiment, change it for other years, months, and days for experimentation with the code
	//Add function here

	question_1 := code_gota.CrashesInYear(mydataframe, 2020)

	fmt.Println("\n\n ***********  GOTA DATAFRAME - QUESTION 1 - Total crashes during in the year 2020 *********** \n\n")

	fmt.Println(question_1)

	fmt.Println("\n\n ***********  GOTA DATAFRAME - QUESTION 1 ENDS *********** \n\n")

	//2. Print a report to show the number of crashes for every Day of the Week for Year 2021
	//call the CrashesDOW function from the code_gota package. Make sure to use the correct arguments
	//same as in the above experiment, change it for other years, months, and days for experimentation with the code
	//Add function here

	question_2 := code_gota.CrashesDOW(mydataframe, "m", "2021")

	fmt.Println("\n\n ***********  GOTA DATAFRAME - QUESTION 2 - Number of crashes for every Day of the Week for Year 2021 ***********")

	fmt.Println(question_2)

	fmt.Println("\n\n ***********  GOTA DATAFRAME - QUESTION 2 ENDS *********** \n\n")

	//3. Print a report to show the total number of crashes reported grouped by PRIM_CONTRIBUTORY_CAUSE for the month of December in the year 2020
	//call the TotalCrashesGrouped function from the code_gota package.. Make sure to use the correct arguments
	//same as in the above experiment, change it for other years, months, and days for experimentation with the code
	//Add function here

	question_3 := code_gota.TotalCrashesGrouped(mydataframe, "December", "2020")

	fmt.Println("\n\n ***********  GOTA DATAFRAME - QUESTION 3 - Total number of crashes reported grouped by PRIM_CONTRIBUTORY_CAUSE *********** \n\n")

	fmt.Print(question_3)

	fmt.Println("\n\n ***********  GOTA DATAFRAME - QUESTION 3 ENDS *********** \n\n")

	//4. Print a report to show the total number of HIT_AND_RUN_I grouped by ROADWAY_SURFACE_COND for the month of December in the year 2020
	//call the HitNRun function from the code_gota package.. Make sure to use the correct arguments
	//same as in the above experiment, change it for other years, months, and days for experimentation with the code
	//Add function here

	question_4 := code_gota.HitNRun(mydataframe, "December", "2020")

	fmt.Println("\n\n ***********  GOTA DATAFRAME - QUESTION 4 - Total number of HIT_AND_RUN_I grouped by ROADWAY_SURFACE_COND *********** \n\n")

	fmt.Println(question_4)

	fmt.Println("\n\n ***********  GOTA DATAFRAME - QUESTION 4 ENDS *********** \n\n")
}
