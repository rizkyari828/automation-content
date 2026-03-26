package main

import (
	"log"
	"time"
)

func main() {
	log.Println("publishing worker placeholder started")

	for {
		time.Sleep(1 * time.Hour)
	}
}
