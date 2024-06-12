package main

import (
	"fmt"
	"net/http"
	"time"
	"msds/utilsMSDS"
)


func main() {
	err := utils.ReadCSVFile(utils.CSVFILE)
	if err != nil {
		fmt.Println(err)
		return
	}

	err = utils.CreateIndex()
	if err != nil {
		fmt.Println("Cannot create index.")
		return
	}

	mux := http.NewServeMux()
	s := &http.Server{
		Addr:         utils.PORT,
		Handler:      mux,
		IdleTimeout:  10 * time.Second,
		ReadTimeout:  time.Second,
		WriteTimeout: time.Second,
	}

	mux.Handle("/list", http.HandlerFunc(utils.ListHandler))
	mux.Handle("/insert/", http.HandlerFunc(utils.InsertHandler))
	mux.Handle("/insert", http.HandlerFunc(utils.InsertHandler))
	mux.Handle("/search", http.HandlerFunc(utils.SearchHandler))
	mux.Handle("/search/", http.HandlerFunc(utils.SearchHandler))
	mux.Handle("/delete/", http.HandlerFunc(utils.DeleteHandler))
	mux.Handle("/status", http.HandlerFunc(utils.StatusHandler))
	mux.Handle("/", http.HandlerFunc(utils.DefaultHandler))

	fmt.Println("Ready to serve at", utils.PORT)
	err = s.ListenAndServe()
	if err != nil {
		fmt.Println(err)
		return
	}
}
