# Scalable and Reliable Backend Data Integration Using Message-Driven Distributed Architectures

## Student Details

**Name:** Jai Chopra  
**Roll Number:** 2210990427  
**Program:** B.E. Computer Science and Engineering (2022–2026)  
**University:** Chitkara University, Punjab, India  

## Supervisor

**Dr. Preeti Saini**  
Assistant Professor  
Department of Computer Science and Engineering  
Chitkara University, Punjab, India

## Project Type

Research Paper — submitted to **The Journal of Supercomputing (Springer Nature)**  
Manuscript ID: `1dddfd94-01a1-4301-8237-088a2fb06817`

## Current Status

The paper has been submitted to Springer Nature and has cleared the initial technical check. It is currently under review. The source code for the experimental setup has been written and deployed.

## Live Demo

[https://scalable-reliable-backend-data-cjg7.onrender.com](https://scalable-reliable-backend-data-cjg7.onrender.com)

The deployed version runs a simulation of the Kafka vs RabbitMQ benchmark with live charts, a source code viewer, and the full experiment results from the paper.

## About the Project

This project compares Apache Kafka and RabbitMQ as asynchronous message brokers against a synchronous Spring Boot REST baseline for backend data integration. Tests were run across 1, 3, and 5-node cluster configurations using a synthetic event workload. Kafka reached 1,000,000 messages per second at 5 nodes, RabbitMQ delivered messages in 3ms, and the REST baseline peaked at 4,500 requests per second before timing out.
