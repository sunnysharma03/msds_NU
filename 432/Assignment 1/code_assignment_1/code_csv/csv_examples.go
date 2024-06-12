package code_csv

//all code here will explore interacting with data using the encoding/csv

import (
	"encoding/csv"
	"fmt"
	"strings"
	"time"
	"os"
	// "strconv"
	// "time"
	// "golang.org/x/exp/slices"
)

const TimeFormat = "1/2/2006 15:04:05 PM"

//This function will read in the data as a slice of slice. This method of reading data will make everything a string
func ReadData(filepath string)[][]string{
//this function will read in the target data without a struct
file, err := os.Open(filepath)
if err != nil {
	fmt.Println(err)
}
defer file.Close()
MyReader := csv.NewReader(file)
MyReader.FieldsPerRecord = -1

AllData, err := MyReader.ReadAll()
if err != nil{
	fmt.Println(err)
}
return AllData
}


func CrashesInYear(data [][]string, year string)map[string]int{
	//This function takes in a string for the year
	//uusing this string, this function will print the total crashes
	//for the provided year.
	//Because I know the column index of the value I want, I do not need to add any additional validation
	//This is not how you should do it in practice as this may hurt your data integrity

	//first, copy your data from the orginal. This will isolate any changes
	mytempdata := data
	//next, we want to see how many crashes there were in a given year. So we will have to see which year we are aiming for.
	//I will use a map[string]int to hold our values.
	crashcount := map[string]int{year:0}
	//looping over the resluts may be the easiest way to get a quick count.
	//Being that we are dealing with all string values, I will have to either parse out the target string or convert the string to a data type of time.
	//FOR EXTRA POINTS TRY CONVERTING THE STRING TO A DATA TYPE OF TIME
	for i,row := range mytempdata{
		if i != 0{
			//get the index related to the crash year
			//parse out the year value from the date index.
			//writing the steps out for teaching.
			//I know the format of my date string. It is day/month/year timestamp, with day not being zero padded.
			//I see that I have a space I can split text on to seperate the date from the timestamp.
			myrawdate := strings.Split(row[3]," ")[0]
			//next, I know I need the year from this string. Becuase the date uses / in the string, I can split on that and take the last item as my string
			myrawyear  := strings.Split(myrawdate,"/")[2]
			if myrawyear == year{
				crashcount[year] += 1
			}
		}
	}

	return crashcount
}

func CrashesDOW(data [][]string,freq,year string)map[string]int{
	//this function will take in some data, a frequency, and target year. 
	//Valid freq inputs are d and w, where d will give daily counts 1-365 and w will give day name counts Mon-Sun
	//first, copy your data from the orginal. This will isolate any changes
	//I will return a map with the counts
	mycrashdata := make(map[string]int)
	mytempdata := data
	//we will first use a switch to handle the different inputs for freq.
	switch strings.ToLower(freq){
	case "d":
		//this is the total crashes for every day of a year.
		for i,row := range mytempdata{
			if i != 0{ //this is making sure we are not looking at the column headers for data
				//get the index related to the crash year
				//parse out the year value from the date index.
				//writing the steps out for teaching.
				//I know the format of my date string. It is day/month/year timestamp, with day not being zero padded.
				//I will convert this string into a datetime type
				mycrashdate,_ := time.Parse(TimeFormat,row[3]) //I will not handle the error but you should
				if fmt.Sprintf("%d",mycrashdate.Year()) == year{ //This is a lazy way to convert ints to strings. You should not use this method in production
					mycrashdata[fmt.Sprintf("%d",mycrashdate.YearDay())] += 1
				}
			}
		}
	case "m":
		//this is the total crashes for every named day of the year
		for i,row := range mytempdata{
			if i != 0{ //this is making sure we are not looking at the column headers for data
				//get the index related to the crash year
				//parse out the year value from the date index.
				//writing the steps out for teaching.
				//I know the format of my date string. It is day/month/year timestamp, with day not being zero padded.
				//I will convert this string into a datetime type
				mycrashdate,_ := time.Parse(TimeFormat,row[3]) //I will not handle the error but you should
				if fmt.Sprintf("%d",mycrashdate.Year()) == year{ //This is a lazy way to convert ints to strings. You should not use this method in production
					mycrashdata[mycrashdate.Weekday().String()] += 1
				}
			}
		}
	default:
		fmt.Println("Please use a valid freq input. Your options are d or m")
	}

	return mycrashdata
}

func TotalCrashesGrouped(data [][]string,col,month,year string)map[string]int{
	//This function takes in some data and group the total counts by the provide col for the target month and year
	//first, copy your data from the orginal. This will isolate any changes
	//I will return a map with the counts
	mycrashdata := make(map[string]int)
	mytempdata := data
	//first, lets find out which column I will need
	var columnTarget int
	for i,name := range mytempdata[0]{
		if name == col{
			columnTarget = i
		}
	}

	//loop over data and try to get our groups and results
	for i,row := range mytempdata{
		if i != 0{ //this is making sure we are not looking at the column headers for data
			//get the index related to the crash year
			//parse out the year value from the date index.
			//writing the steps out for teaching.
			//I know the format of my date string. It is day/month/year timestamp, with day not being zero padded.
			//I will convert this string into a datetime type
			mycrashdate,_ := time.Parse(TimeFormat,row[3]) //I will not handle the error but you should
			if fmt.Sprintf("%d",mycrashdate.Year()) == year && (mycrashdate.Month().String() == month || fmt.Sprintf("%d",mycrashdate.Month()) == month ){ //This is a lazy way to convert ints to strings. You should not use this method in production
				mycrashdata[row[columnTarget]] += 1
			}
		}
	}
	return mycrashdata
}

func HitNRun(data [][]string,filter_col,filter_qual, trgt_col, month, year string)map[string]int{
	//This function takes some data, a filtering column and will provide the total crashes where the filtering column matches the filtering qual
	//first, copy your data from the orginal. This will isolate any changes
	//I will return a map with the counts
	mycrashdata := make(map[string]int)
	mytempdata := data
	//first, lets find out which column I will need
	columnTarget, filterColumn := 0,0 
	for i,name := range mytempdata[0]{ //This is the column to group results by

		switch name{
		case filter_col:
			filterColumn = i
		case trgt_col:
			columnTarget = i
		}
	}

	//loop over data and try to get our groups and results
	for i,row := range mytempdata{
		if i != 0{ //this is making sure we are not looking at the column headers for data
			//get the index related to the crash year
			//parse out the year value from the date index.
			//writing the steps out for teaching.
			//I know the format of my date string. It is day/month/year timestamp, with day not being zero padded.
			//I will convert this string into a datetime type
			mycrashdate,_ := time.Parse(TimeFormat,row[3]) //I will not handle the error but you should
			if fmt.Sprintf("%d",mycrashdate.Year()) == year && (mycrashdate.Month().String() == month || fmt.Sprintf("%d",mycrashdate.Month()) == month ){ //This is a lazy way to convert ints to strings. You should not use this method in production
				if strings.ToLower(row[filterColumn]) == strings.ToLower(strings.TrimSpace(filter_qual)){
					mycrashdata[row[columnTarget]] += 1
				}else{
					continue
				}
				
			}
		}
	}
	
	return mycrashdata
}