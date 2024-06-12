package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"math/rand"
	"runtime"
	"time"
)

type Data struct {
	Key string `json:"key"`
	Val int    `json:"value"`
}

var (
	DataRecords []Data
	MIN         = 0
	MAX         = 26
	RecordGen   = []int{10000, 100000, 1000000}
)

func random(min, max int) int {
	rand.Seed(time.Now().UnixNano())
	return rand.Intn(max-min) + min
}

func getString(l int64) string {
	startChar := "A"
	temp := ""
	var i int64 = 1
	for {
		myRand := random(MIN, MAX)
		newChar := string(startChar[0] + byte(myRand))
		temp = temp + newChar
		if i == l {
			break
		}
		i++
	}
	return temp
}

// DeSerialize decodes a serialized slice with JSON records
func DeSerialize(e *json.Decoder, slice interface{}) error {
	return e.Decode(slice)
}

// Serialize serializes a slice with JSON records
func Serialize(e *json.Encoder, slice interface{}) error {
	return e.Encode(slice)
}

func PrimaryTest(recordCount int) (time.Duration, time.Duration) {
	var i int
	var t Data
	for i = 0; i < recordCount; i++ {
		t = Data{
			Key: getString(5),
			Val: random(1, 100),
		}
		DataRecords = append(DataRecords, t)
	}

	buf := new(bytes.Buffer)

	startSerialize := time.Now()
	encoder := json.NewEncoder(buf)
	err := Serialize(encoder, DataRecords)
	if err != nil {
		fmt.Println(err)
		return 0, 0
	}
	elapsedSerialize := time.Since(startSerialize)

	decoder := json.NewDecoder(buf)
	var temp []Data
	startDeserialize := time.Now()
	err = DeSerialize(decoder, &temp)
	if err != nil {
		fmt.Println(err)
		return 0, 0
	}
	elapsedDeserialize := time.Since(startDeserialize)

	return elapsedSerialize, elapsedDeserialize
}

func main() {
	var durationTracker []string
	var memTracker []string
	var cpuTimeTracker []string

	for _, val := range RecordGen {
		start := time.Now()
		elapsedSerialize, elapsedDeserialize := PrimaryTest(val)
		duration := fmt.Sprintf("\nTime to run %d records was:\nSerialization: %v\nDeserialization: %v", val, elapsedSerialize, elapsedDeserialize)
		durationTracker = append(durationTracker, duration)

		memUsed := PrintMemUsage(val)
		memTracker = append(memTracker, memUsed)

		// Calculate and append CPU time
		elapsed := time.Since(start)
		cpuTime := fmt.Sprintf("CPU time for %d records: %s", val, elapsed)
		cpuTimeTracker = append(cpuTimeTracker, cpuTime)
	}

	// Print time to run results
	for _, runtime := range durationTracker {
		fmt.Println(runtime)
	}

	// Print memory used results
	for _, memUsed := range memTracker {
		fmt.Println(memUsed)
	}

	// Print CPU time results
	for _, cpuTime := range cpuTimeTracker {
		fmt.Println(cpuTime)
	}
}

func PrintMemUsage(records int) string {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	mainString :=
		fmt.Sprintf("\nMemory used for %d records:\nAlloc = %v MiB\tTotalAlloc = %v MiB\tSys = %v MiB\tNumGC = %v\n", records, bToMb(m.Alloc), bToMb(m.TotalAlloc), bToMb(m.Sys), m.NumGC)
	return mainString
}

func bToMb(b uint64) uint64 {
	return b / 1024 / 1024
}
