package main

import (
	"fmt"
	"math/rand"
	"time"
)

func multiplyIntSlice(values []int, multiplier int) []int {
	multipliedValues := make([]int, len(values))
	for i, v := range values {
		multipliedValues[i] = v * multiplier
	}
	return multipliedValues
}

func multiplyFloatSlice(values []float64, multiplier float64) []float64 {
	multipliedValues := make([]float64, len(values))
	for i, v := range values {
		multipliedValues[i] = v * multiplier
	}
	return multipliedValues
}

func add(values []int, additive int) []int {
	addedValues := make([]int, len(values))
	for i, v := range values {
		addedValues[i] = v + additive
	}
	return addedValues
}

func addFloat(values []float64, additive float64) []float64 {
	addedValues := make([]float64, len(values))
	for i, v := range values {
		addedValues[i] = v + additive
	}
	return addedValues
}

func generateRandomIntSlice(size int) []int {
	rand.Seed(time.Now().UnixNano())
	slice := make([]int, size)
	for i := 0; i < size; i++ {
		slice[i] = rand.Intn(1000) // Generating random integers between 0 and 999
	}
	return slice
}

func generateRandomFloatSlice(size int) []float64 {
	rand.Seed(time.Now().UnixNano())
	slice := make([]float64, size)
	for i := 0; i < size; i++ {
		slice[i] = rand.Float64() * 1000 // Generating random floats between 0 and 999
	}
	return slice
}

func main() {
	sampleSizes := []int{10000, 100000, 1000000}

	for _, size := range sampleSizes {
		intSlice := generateRandomIntSlice(size)
		floatSlice := generateRandomFloatSlice(size)

		startInt := time.Now()
		_ = add(multiplyIntSlice(intSlice, 2), 1)
		intDuration := time.Since(startInt)

		startFloat := time.Now()
		_ = addFloat(multiplyFloatSlice(floatSlice, 2), 1.0)
		floatDuration := time.Since(startFloat)

		fmt.Printf("Experiment with %d elements:\n", size)
		fmt.Printf("  Integer slice: %v\n", intDuration)
		fmt.Printf("  Float slice: %v\n", floatDuration)
		fmt.Println()
	}
}
