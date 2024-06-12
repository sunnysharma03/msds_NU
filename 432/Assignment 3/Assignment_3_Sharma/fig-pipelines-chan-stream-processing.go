package main

import (
	"fmt"
	"math/rand"
	"time"
)

func generator(done <-chan interface{}, integers ...int) <-chan int {
	intStream := make(chan int)
	go func() {
		defer close(intStream)
		for _, i := range integers {
			select {
			case <-done:
				return
			case intStream <- i:
			}
		}
	}()
	return intStream
}

func multiply(done <-chan interface{}, intStream <-chan int, multiplier int) <-chan int {
	multipliedStream := make(chan int)
	go func() {
		defer close(multipliedStream)
		for i := range intStream {
			select {
			case <-done:
				return
			case multipliedStream <- i * multiplier:
			}
		}
	}()
	return multipliedStream
}

func add(done <-chan interface{}, intStream <-chan int, additive int) <-chan int {
	addedStream := make(chan int)
	go func() {
		defer close(addedStream)
		for i := range intStream {
			select {
			case <-done:
				return
			case addedStream <- i + additive:
			}
		}
	}()
	return addedStream
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

	done := make(chan interface{})
	defer close(done) // Move this line outside of the loop

	for _, size := range sampleSizes {
		intSlice := generateRandomIntSlice(size)
		floatSlice := generateRandomFloatSlice(size)

		intSliceConverted := make([]int, len(floatSlice))
		for i, v := range floatSlice {
			intSliceConverted[i] = int(v)
		}

		startInt := time.Now()
		intStream := generator(done, intSlice...)
		pipeline := multiply(done, add(done, multiply(done, intStream, 2), 1), 2)
		for range pipeline {
		}
		intDuration := time.Since(startInt)

		startFloat := time.Now()
		floatStream := generator(done, intSliceConverted...)
		floatPipeline := multiply(done, add(done, multiply(done, floatStream, 2), 1), 2)
		for range floatPipeline {
		}
		floatDuration := time.Since(startFloat)

		fmt.Printf("Experiment with %d elements:\n", size)
		fmt.Printf("  Integer slice: %v\n", intDuration)
		fmt.Printf("  Float slice: %v\n", floatDuration)
		fmt.Println()
	}
}
