---
author: BENTEGAR Sid Ahmed Abdelillah
pubDatetime: 2025-02-17T15:22:00Z
title: How to expose Prometheus metrics from your Laravel application
postSlug: expose-promehteus-metrics-from-laravel
featured: true
tags:
  - php
  - laravel
  - devops
  - observability
description: In this post, I will be discussing how to deploy a Laravel application to a production-ready VPS, covering setup, optimization, and security best practices.
---

## TLDR

In this poste, we discussed how to expose Prometheus metrics from a Laravel application. We explored the benefits of using Prometheus over building a custom solution, including separation of concerns and leveraging an established monitoring stack. We also covered the installation and configuration of the Spatie Laravel Prometheus package, and provided examples of implementing simple and complex gauges with multiple labels.

## Introduction

While working on a SaaS platform, I needed to track various business metrics and have dashboards that are specific to my needs as the business owner. Faced with this requirement, I had two options: either write the full implementation for everything (both backend and frontend) or use an already established stack for monitoring.

In this post, I will discuss how I chose to expose Prometheus metrics from my Laravel application, the benefits of using Prometheus over building a custom solution, and the steps involved in setting it up.

## Why I Chose Prometheus Over Implementing It from Scratch

First of all, let's talk about the separation of concerns. Writing such dashboards and metrics on the frontend would require a large implementation. It's not just about exposing the metrics, but also about keeping historical data (such as active users, active sessions, and business-specific metrics). This requires having database tables that store this historical data.

In this case, we would have two solutions:

- **Include these tables in the application database:** This would consume resources that are meant for users, potentially impacting the performance of the application.
- **Export these metrics to a dedicated database:** A time-series database that has a standard, known way to collect metrics and can be used as part of a widely implemented stack for metrics and monitoring.

This is where Prometheus comes in. Prometheus is a powerful time-series database designed specifically for monitoring and metrics collection. It provides a standard way to collect and store metrics, making it easier to build dashboards and track historical data.

Additionally, I had already started working on the monitoring and observability part for the infrastructure, so it made sense to include these metrics in Prometheus. This way, I could leverage the existing monitoring stack and avoid duplicating efforts by building a custom solution from scratch.

## Spatie Laravel Prometheus

Spatie Laravel Prometheus is a Laravel package developed by the well-known Spatie.be. This package provides a simple interface for exporting Prometheus metrics from your Laravel backend.

### Instalation

1. Require the package via Composer

```bash
composer require spatie/laravel-prometheus
```

2. Publish the configuration file:

```bash
php artisan prometheus:install
```

### Configuration

- Enable the package

```php
// config/prometheus.php
'enabled' => env('ENABLE_PROMETHEUS', false),
```

This setting allows you to enable or disable the package.

- Allowed IPs:

```php
// config/prometheus.php
'allowed_ips' => env('PROMETHEUS_ALLOWED_IPS', ['127.0.0.1']),
```

These are the IP addresses that are allowed to access the metrics endpoint.

- Metrics URL:

```php
// config/prometheus.php
'urls' => [
    'default' => 'metrics',
],
```

This exposes the metrics over the /metrics endpoint, which is the standard for Prometheus metrics.

## Writing Gauges

### Writing the First Gauge

Writing the gauges (or the metrics) is done inside the PrometheusServiceProvider's register function. Here is a simple gauge implementation:

```php
use Prometheus\Prometheus;
use Illuminate\Support\Facades\Cache;
use App\Models\User;

class PrometheusServiceProvider extends ServiceProvider
{
    public function register()
    {
        // Add a gauge for total users
        Prometheus::addGauge('pandacors_total_users')->
          (function () {
            return Cache::remember(
              'metric_total_users',
              now()->addMinutes(5),
              fn () => User::count();
            );
        });
    }
}
```

In this example, we are adding a gauge named pandacors_total_users that counts the total number of users in the application. The gauge is a type of metric that represents a single numerical value that can arbitrarily go up and down.

#### Explanation

- **Gauge Name:** pandacors_total_users is the name of the gauge. This name will be used by Prometheus to identify this specific metric.
- **Value Function:** The value function is used to define how the value of the gauge is calculated. In this case, we are using a closure that returns the total number of users.
- **Caching:** To reduce the load on the database, we use Laravel's Cache facade to cache the result of the user count query. The Cache::remember method stores the result in the cache for 5 minutes (`now()->addMinutes(5)`). If the cached value exists, it is returned; otherwise, the closure is executed to get the user count from the database and store it in the cache.
- **Database Query:** The `User::count()` method is used to get the total number of users from the database. This query can be expensive if executed frequently, hence the use of caching.

### Gauges with Multiple Labels

To implement a gauge with multiple labels, we need to provide a list of labels for the gauge. For each value, we need to provide the value and the corresponding label values. This allows us to categorize the metrics based on different labels.

#### Simple Example

```php

Prometheus::addGauge('user_count')
  ->label('status')
  ->value(function() {
    return [
      [User::where('status', 'active')->count(), ['active']],
      [User::where('status', 'inactive')->count(), ['inactive']],
    ];
  });
```

In this example:

- We define a gauge named user_count.
- We add a label called status.
- We provide the values for the gauge along with the corresponding label values (active and inactive).

#### Complex Example

Here is a more complex example where we count subscriptions based on their status (trial, active, disabled):

```php
use Prometheus\Prometheus;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use App\Models\Enterprise;

class PrometheusServiceProvider extends ServiceProvider
{
    public function register()
    {
        // Add a gauge for subscription count with status label
        Prometheus::addGauge('pandacors_subscription')
            ->label('status')
            ->value(function() {
                return Cache::remember(
                  'metric_total_subscriptions',
                  now()->addMinutes(5),
                  function () {
                    $subQuery = DB::table('enterprises', 'e')
                        ->leftJoin('subscriptions as s', 's.subscriber_id', '=', 'e.id')
                        ->where('s.subscriber_type', Enterprise::class)
                        ->select([
                            DB::raw("
                                CASE
                                    WHEN s.trial_ends_at IS NOT NULL AND s.trial_ends_at > NOW() THEN 'trial'
                                    WHEN s.ends_at > NOW() THEN 'active'
                                    ELSE 'disabled'
                                END AS status
                            ")
                        ])
                        ->groupBy(['status', 'e.id']);

                    return DB::query()
                        ->fromSub($subQuery, 'sub')
                        ->selectRaw('COUNT(*) AS total, status')
                        ->groupBy('status')
                        ->get()
                        ->map(fn($row) => [$row->total, ['status' => $row->status]])
                        ->toArray();
                });
            });
    }
}
```

In this example:

- We define a gauge named pandacors_subscription.
- We add a label called status.
- We use a subquery to determine the status of each subscription (trial, active, disabled).
- We group the results by status and count the total number of subscriptions for each status.
- We cache the result for 5 minutes to reduce the load on the database.

By using labels, we can categorize and filter metrics based on different dimensions, making it easier to analyze and visualize the data in Prometheus.

## Conclusion

Exposing Prometheus metrics from your Laravel application allows you to leverage a powerful and widely-used monitoring stack. By using the Spatie Laravel Prometheus package, you can easily export metrics and track important business and application metrics. This approach not only simplifies the implementation but also ensures that you can efficiently monitor and analyze your application's performance and health. By integrating Prometheus with your existing monitoring infrastructure, you can gain valuable insights and make data-driven decisions to improve your application's reliability and scalability.
