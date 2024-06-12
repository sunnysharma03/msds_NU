This file contains all error that we faced initailly while running the www-phone-go and handlers.go program file and also contains the steps that we took to resolve them.

Error Messages and Solutions:
Issue1:
./www-phone.go:41:24: missing argument in conversion to http.HandlerFunc
./www-phone.go:42:25: missing argument in conversion to http.HandlerFunc
./www-phone.go:43:25: missing argument in conversion to http.HandlerFunc
./www-phone.go:44:24: missing argument in conversion to http.HandlerFunc
./www-phone.go:45:18: missing argument in conversion to http.HandlerFunc

Solution:
The error indicates missing arguments in the conversion to http.HandlerFunc in the specified lines of the www-phone.go file. To resolve this, ensure that the corresponding handlers are properly registered with the http.HandlerFunc. Here's an example of how it can be fixed:

mux.Handle("/search", http.HandlerFunc(utils.SearchHandler))
mux.Handle("/search/", http.HandlerFunc(utils.SearchHandler))
mux.Handle("/delete/", http.HandlerFunc(utils.deleteHandler))
mux.Handle("/status", http.HandlerFunc(utils.StatusHandler))
mux.Handle("/", http.HandlerFunc(utils.defaultHandler))



Issue2:
./www-phone.go:43:48: undefined: utils.deleteHandler
./www-phone.go:45:41: undefined: utils.defaultHandler

Solution:
The error indicates that the functions deleteHandler and defaultHandler are undefined in the utils package. To resolve this, ensure that the function names in the handlers.go file are capitalized appropriately. Here's how you can fix it:
// Change from:
func deleteHandler(w http.ResponseWriter, r *http.Request) 
func defaultHandler(w http.ResponseWriter, r *http.Request)

// To:
func DeleteHandler(w http.ResponseWriter, r *http.Request) 
func DefaultHandler(w http.ResponseWriter, r *http.Request)

Make sure to capitalize the first letter of each function name in the handlers.go file to match the references in www-phone.go



Issue3:
Port number is missing:
fmt.Println("Ready to serve at", /*add the PORT varable from utils*/)

Solution:
fmt.Println("Ready to serve at", utils.PORT)