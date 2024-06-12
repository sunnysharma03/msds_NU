package code_gota

import (
	"encoding/csv"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/go-gota/gota/dataframe"
	"github.com/go-gota/gota/series"
)

const TimeFormat = "1/2/2006 15:04:05 PM"

func ReadData(filepath string)dataframe.DataFrame{
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

	df := dataframe.LoadRecords(AllData)
	return df
}
func CrashesInYear(data dataframe.DataFrame, year int)int{
	//This function takes in a string for the year
	//uusing this string, this function will print the total crashes
	//for the provided year.
	//first, make a copy of the DF for safety
	mytempdata := data.Copy()
	//next lets filter our data to the target year
	//first, I need to transfor a column to only give crash years
	mytempdata = mytempdata.Mutate(
		series.New(
			func(s series.Series) series.Series{
				//get a series of years
				var myyears []int
				for _,data := range s.Records(){
					mycrashdate,_ := time.Parse(TimeFormat,data)
					myyears = append(myyears, mycrashdate.Year())
				}
				return series.Ints(myyears)

			}(mytempdata.Col("CRASH_DATE")),series.Int,"CRASH_YEAR_MUT"))
	//Filtering our DF using the new column
	filterdata := mytempdata.Filter(dataframe.F{
		Colname:    "CRASH_YEAR_MUT",
		Comparator: series.Eq,
		Comparando: year,
	})
	//print the len of the dataframe as we have a filter for a single year
	return filterdata.Nrow()
}

func CrashesDOW(data dataframe.DataFrame,freq, year string) dataframe.DataFrame{
	//this function will take in some data, a frequency, and target year. 
	//Valid freq inputs are d and w, where d will give daily counts 1-365 and w will give day name counts Mon-Sun
	//first, make a copy of the DF for safety
	mytempdata := data.Copy()
	//next lets filter our data to the target year
	//first, I need to transfor a column to only give crash years
	mytempdata = mytempdata.Mutate(
		series.New(
			func(s series.Series) series.Series{
				//get a series of years
				var myyears []int
				for _,data := range s.Records(){
					mycrashdate,_ := time.Parse(TimeFormat,data)
					myyears = append(myyears, mycrashdate.Year())
				}
				return series.Ints(myyears)

			}(mytempdata.Col("CRASH_DATE")),series.String,"CRASH_YEAR_MUT"))

	//first, I need to transfor a column to only give date day of year
	mytempdata = mytempdata.Mutate(
		series.New(
			func(s series.Series) series.Series{
				//get a series of years
				var mydayofyear []int
				for _,data := range s.Records(){
					mycrashdate,_ := time.Parse(TimeFormat,data)
					mydayofyear = append(mydayofyear, mycrashdate.YearDay())
				}
				return series.Ints(mydayofyear)

			}(mytempdata.Col("CRASH_DATE")),series.String,"CRASH_YEAR_DAY_MUT"))

	//first, I need to transfor a column to only give day of week by year
	mytempdata = mytempdata.Mutate(
		series.New(
			func(s series.Series) series.Series{
				//get a series of years
				var mydayofweekyear []string
				for _,data := range s.Records(){
					mycrashdate,_ := time.Parse(TimeFormat,data)
					mydayofweekyear = append(mydayofweekyear, mycrashdate.Weekday().String())
				}
				return series.Strings(mydayofweekyear)

			}(mytempdata.Col("CRASH_DATE")),series.String,"CRASH_WEEKDAY_MUT"))

	//Filtering our DF using the new column
	filterdata := mytempdata.Filter(dataframe.F{
		Colname:    "CRASH_YEAR_MUT",
		Comparator: series.Eq,
		Comparando: year,
	})

	var mydataframeoutpput dataframe.DataFrame
	switch strings.ToLower(freq) {
	case "d":
		mydataframeoutpput = filterdata.GroupBy("CRASH_YEAR_DAY_MUT").Aggregation([]dataframe.AggregationType{7},[]string{"CRASH_YEAR_DAY_MUT"})
	case "m":
		mydataframeoutpput = filterdata.GroupBy("CRASH_WEEKDAY_MUT").Aggregation([]dataframe.AggregationType{7},[]string{"CRASH_WEEKDAY_MUT"})
	default:
		fmt.Println("Please use a valid freq input. Your options are d or m")
	}
	return mydataframeoutpput
}

func TotalCrashesGrouped(data dataframe.DataFrame, month, year string) dataframe.DataFrame{
	//This function takes in some data and group the total counts by the provide col for the target month and year
	//first, copy your data from the orginal. This will isolate any changes
		//first, make a copy of the DF for safety
		mytempdata := data.Copy()
		//next lets filter our data to the target year
		//first, I need to transfor a column to only give crash years
		mytempdata = mytempdata.Mutate(
			series.New(
				func(s series.Series) series.Series{
					//get a series of years
					var myyears []int
					for _,data := range s.Records(){
						mycrashdate,_ := time.Parse(TimeFormat,data)
						myyears = append(myyears, mycrashdate.Year())
					}
					return series.Ints(myyears)
	
				}(mytempdata.Col("CRASH_DATE")),series.String,"CRASH_YEAR_MUT"))
	
		//first, I need to transfor a column to only give date day of year
		mytempdata = mytempdata.Mutate(
			series.New(
				func(s series.Series) series.Series{
					//get a series of years
					var mydayofyear []string
					for _,data := range s.Records(){
						mycrashdate,_ := time.Parse(TimeFormat,data)
						mydayofyear = append(mydayofyear, mycrashdate.Month().String())
					}
					return series.Strings(mydayofyear)
	
				}(mytempdata.Col("CRASH_DATE")),series.String,"CRASH_Month_MUT"))
	
		//Filtering our DF using the new column
		filterdata := mytempdata.Filter(dataframe.F{
			Colname:    "CRASH_YEAR_MUT",
			Comparator: series.Eq,
			Comparando: year,
		},dataframe.F{
			Colname:    "CRASH_Month_MUT",
			Comparator: series.Eq,
			Comparando: month,
		})
	

			mydataframeoutpput := filterdata.GroupBy("PRIM_CONTRIBUTORY_CAUSE").Aggregation([]dataframe.AggregationType{7},[]string{"PRIM_CONTRIBUTORY_CAUSE"})

		return mydataframeoutpput
}

func HitNRun(data dataframe.DataFrame, month, year string) dataframe.DataFrame{
		//This function takes some data, a filtering column and will provide the total crashes where the filtering column matches the filtering qual
		//first, make a copy of the DF for safety
		mytempdata := data.Copy()
		//next lets filter our data to the target year
		//first, I need to transfor a column to only give crash years
		mytempdata = mytempdata.Mutate(
			series.New(
				func(s series.Series) series.Series{
					//get a series of years
					var myyears []string
					for _,data := range s.Records(){
						mycrashdate,_ := time.Parse(TimeFormat,data)
						myyears = append(myyears, fmt.Sprintf("%d",mycrashdate.Year()))
					}
					return series.Strings(myyears)
	
				}(mytempdata.Col("CRASH_DATE")),series.String,"CRASH_YEAR_MUT"))
	
		//first, I need to transfor a column to only give date day of year
		mytempdata = mytempdata.Mutate(
			series.New(
				func(s series.Series) series.Series{
					//get a series of years
					var mydayofyear []string
					for _,data := range s.Records(){
						mycrashdate,_ := time.Parse(TimeFormat,data)
						mydayofyear = append(mydayofyear, mycrashdate.Month().String())
					}
					return series.Strings(mydayofyear)
	
				}(mytempdata.Col("CRASH_DATE")),series.String,"CRASH_Month_MUT"))
	
		//Filtering our DF using the new column
		filterdata := mytempdata.Filter(dataframe.F{
			Colname:    "CRASH_YEAR_MUT",
			Comparator: series.Eq,
			Comparando: year,
		})

		filterdata2 := filterdata.Filter(dataframe.F{
			Colname:    "CRASH_Month_MUT",
			Comparator: series.Eq,
			Comparando: month,
		})		
		
		filterdata3 := filterdata2.Filter(dataframe.F{
			Colname:    "HIT_AND_RUN_I",
			Comparator: series.Eq,
			Comparando: "Y",
		})

			mydataframeoutpput := filterdata3.GroupBy("ROADWAY_SURFACE_COND").Aggregation([]dataframe.AggregationType{7},[]string{"ROADWAY_SURFACE_COND"})

		return mydataframeoutpput
}