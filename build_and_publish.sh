#!/bin/bash
docker build . -t voteit/voteit4frontend:latest
docker push voteit/voteit4frontend:latest
