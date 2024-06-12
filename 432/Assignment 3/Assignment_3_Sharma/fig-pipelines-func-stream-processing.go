package main

import (
	"fmt"
	"math/rand"
	"time"
)

func multiply(value, multiplier int, out chan<- int) {
	out <- value * multiplier
}

func add(value, additive int, in <-chan int, out chan<- int) {
	result := value + additive
	out <- result
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

		done := make(chan struct{})
		defer close(done)

		startInt := time.Now()
		intResults := make(chan int, len(intSlice))
		defer close(intResults)
		intAdditions := make(chan int, len(intSlice))
		defer close(intAdditions)

		for _, v := range intSlice {
			go multiply(v, 2, intResults)
		}

		for range intSlice {
			go add(<-intResults, 1, intAdditions, intAdditions)
		}

		// for range intSlice {
		// 	fmt.Println(<-intAdditions)
		// }

		intDuration := time.Since(startInt)

		startFloat := time.Now()
		floatResults := make(chan int, len(floatSlice))
		defer close(floatResults)
		floatAdditions := make(chan int, len(floatSlice))
		defer close(floatAdditions)

		for _, v := range floatSlice {
			go multiply(int(v), 2, floatResults)
		}

		for range floatSlice {
			go add(<-floatResults, 1, floatAdditions, floatAdditions)
		}

		// for range floatSlice {
		// 	fmt.Println(<-floatAdditions)
		// }

		floatDuration := time.Since(startFloat)

		fmt.Printf("Experiment with %d elements:\n", size)
		fmt.Printf("  Integer slice: %v\n", intDuration)
		fmt.Printf("  Float slice: %v\n", floatDuration)
		fmt.Println()
	}
}