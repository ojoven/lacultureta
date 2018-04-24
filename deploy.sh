#!/bin/bash
rsync -vur --exclude=".env" --exclude=".git" --exclude="storage" --exclude="public/node_modules" ./* root@188.165.236.46:/home/lacultureta/