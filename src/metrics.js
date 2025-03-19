const config = require("./config.js");
const os = require("os");

class Metrics {
  constructor() {
    this.totalRequests = 0;
    this.totalGetRequests = 0;
    this.totalPostRequests = 0;
    this.totalDeleteRequests = 0;
    this.activeUsers = 0;
    this.successfulAuthentications = 0;
    this.failedAuthentications = 0;
    this.pizzasSold = 1;
    this.pizzaFailures = 0;
    this.revenue = 0;

    // This will periodically sent metrics to Grafana
    const timer = setInterval(() => {
      this.systemMetrics();
      this.systemRequests();
      this.activeUsersMetrics();
      this.authenticationMetrics();
      this.pizzasSoldMetrics();
      this.pizzaFailureMetrics();
      this.revenueMetrics();
    }, 10000);
    timer.unref();
  }

  revenueMetrics() {
    this.sendMetricToGrafana("revenue", "all", "total", this.revenue);
  }

  pizzasSoldMetrics() {
    this.sendMetricToGrafana("pizzasSold", "all", "total", this.pizzasSold);
  }

  pizzaFailureMetrics() {
    this.sendMetricToGrafana(
      "pizzaFailure",
      "all",
      "total",
      this.pizzaFailures
    );
  }

  activeUsersMetrics() {
    this.sendMetricToGrafana("activeUsers", "all", "total", this.activeUsers);
  }

  authenticationMetrics() {
    this.sendMetricToGrafana(
      "authentication",
      "all",
      "successful",
      this.successfulAuthentications
    );
    this.sendMetricToGrafana(
      "authentication",
      "all",
      "failed",
      this.failedAuthentications
    );
  }

  systemRequests() {
    this.sendMetricToGrafana("request", "all", "total", this.totalRequests);
    this.sendMetricToGrafana("request", "get", "total", this.totalGetRequests);
    this.sendMetricToGrafana(
      "request",
      "post",
      "total",
      this.totalPostRequests
    );
    this.sendMetricToGrafana(
      "request",
      "delete",
      "total",
      this.totalDeleteRequests
    );
  }

  getCpuUsagePercentage() {
    const cpuUsage = os.loadavg()[0] / os.cpus().length;
    return Number(cpuUsage.toFixed(2)) * 100;
  }

  getMemoryUsagePercentage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = (usedMemory / totalMemory) * 100;
    return memoryUsage.toFixed(2);
  }

  systemMetrics() {
    const cpuUsage = this.getCpuUsagePercentage();
    const memoryUsage = this.getMemoryUsagePercentage();

    this.sendMetricToGrafana("system", "all", "cpu", cpuUsage);
    this.sendMetricToGrafana("system", "all", "memory", memoryUsage);
  }

  incrementTotalRequests() {
    this.totalRequests++;
  }

  incrementTotalRevenue(items) {
    for (const item of items) {
      this.revenue += item.price;
    }
  }

  incrementTotalGetRequests() {
    this.totalGetRequests++;
    this.incrementTotalRequests();
  }

  incrementTotalPostRequests() {
    this.totalPostRequests++;
    this.incrementTotalRequests();
  }

  incrementTotalDeleteRequests() {
    this.totalDeleteRequests++;
    this.incrementTotalRequests();
  }

  incrementSuccessfulAuthentications() {
    this.successfulAuthentications++;
  }

  incrementFailedAuthentications() {
    this.failedAuthentications++;
  }

  incrementActiveUsers() {
    this.activeUsers++;
  }

  decrementActiveUsers() {
    if (this.activeUsers !== 0) {
      this.activeUsers--;
    }
  }

  incrementPizzasSold() {
    this.pizzasSold++;
  }

  incrementPizzaFailures() {
    this.pizzaFailures++;
  }

  collectRequest(req, res, next) {
    const path = req.path;
    const method = req.method;
    switch (method) {
      case "GET":
        this.incrementTotalGetRequests();
        break;
      case "POST":
        this.incrementTotalPostRequests();
        break;
      case "DELETE":
        this.incrementTotalDeleteRequests();
        break;
      default:
        this.incrementTotalRequests();
        break;
    }

    const start = process.hrtime();

    res.on("finish", () => {
      if (path === "/api/order" && method === "POST") {
        if (res.statusCode === 200) {
          this.incrementPizzasSold();
        } else {
          this.incrementPizzaFailures();
        }
      }
      const [seconds, nanoseconds] = process.hrtime(start);
      const milliseconds = seconds * 1000 + nanoseconds / 1e6;
      this.sendMetricToGrafana(
        "request",
        "all",
        "latency",
        milliseconds.toFixed(2)
      );
      if (path === "/api/order" && method === "POST") {
        this.sendMetricToGrafana(
          "makePizza",
          "post",
          "latency",
          milliseconds.toFixed(2)
        );
      }
    });

    next();
  }

  sendMetricToGrafana(metricPrefix, httpMethod, metricName, metricValue) {
    // Get the current time in Unix nanoseconds
    const timeUnixNano = BigInt(Date.now()) * BigInt(1_000_000); // Convert milliseconds to nanoseconds

    const isFloat =
      typeof metricValue === "number" && !Number.isInteger(metricValue);

    // Prepare the metric data in the expected structure
    const metricData = {
      resourceMetrics: [
        {
          scopeMetrics: [
            {
              metrics: [
                {
                  name: `${metricPrefix}_${metricName}`,
                  unit: "1", // You can change this if needed
                  description: "",
                  gauge: {
                    dataPoints: [
                      {
                        asDouble: metricValue, // You can adjust this to use asFloat if needed
                        timeUnixNano: timeUnixNano.toString(),
                        attributes: [
                          {
                            key: "method",
                            value: {
                              stringValue: httpMethod,
                            },
                          },
                          {
                            key: "source",
                            value: {
                              stringValue: config.metrics.source,
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    //console.log("Sending metric data:", JSON.stringify(metricData, null, 2));
    console.log(`Metric Name: ${metricPrefix}_${metricName}`);
    console.log(`Metric Value: ${metricValue}`);

    // Sending the data to Grafana
    fetch(`${config.metrics.url}`, {
      method: "post",
      body: JSON.stringify(metricData),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.metrics.userId}:${config.metrics.apiKey}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          const text = await response.text();
          console.error(
            `Failed to push metrics data to Grafana: ${text}\n${JSON.stringify(
              metricData
            )}`
          );
        } else {
          console.log(`Pushed metric ${metricName}`);
        }
      })
      .catch((error) => {
        console.error("Error pushing metrics:", error);
      });
  }
}

const metrics = new Metrics();
module.exports = metrics;
