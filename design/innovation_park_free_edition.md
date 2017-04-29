User story
============================

创建应用(适用于PaaS和CaaS)
----------------------------
* 为应用分配资源时，只分配最大内存(不按照机器来分配资源了)，比如10x (10 * 128M)。免费版，暂定最大不超过5x吧。端口实际上也应该做一个限制。
* 该应用下的所有实例(线下和线上)，都共享这个内存资源池。实例只有在运行时，才占用资源。如果没有运行，不占用资源。如果资源不足，有可能实例中的某些组件无法启动。界面上会进行原因的提示。

组件对外服务的设置(适用于PaaS和CaaS)
----------------------------
* 用户只需要指定组件所要导出的容器内的端口。
* 服务的的端口，以及对外访问的domain(IP)，由iDevOps自动分配.

**Questions**

- Q1. 如果服务的端口不是80或者8080，通过域名访问，必须通过域名:port方式来访问
- Q2. 如果暴露的是某个机器的公网IP，并且该机器上还有其他公司的app的实例端口，会有安全性问题。

实现
============================

资源分配
-------------------------------------------------------------------------------
* 每个应用(注意不是实例)分配一个namespace，并设置resource quota

应用实例运行时的组件selector
-------------------------------------------------------------------------------
因为同一个应用下的实例全部共享一个namespace，paas-api在select某个实例的组件时，需要做特别处理。方法如下：

* 每个app的实例，包括每个caas实例，分配一个instance_id。
* 在rc和svc的label和selector中，增加一个buildin的label，叫做iDevOps/instanceId
* paas-api在query 某个stack的所有组件的时候，可以利用label iDevOps/instanceId和namespace将属于该应用实例或者CaaS实例的所有pod, svc, rc读取出来。

服务的机器和端口分配
-------------------------------------------------------------------------------
* 平台需要记录主机端口的使用情况
* 当为某个组件创建服务时，平台从端口资源池中自动分配一个主机和端口。

caas实现
=======================================
* 管理员创建CaaS APP后，就为该CaaS APP分配一个namespace。
* 在该caas app下，开发测试人员创建的caas instance(就是单个容器)，均属于该namespace。
  并且每个caas instance均分配一个该namespace下的唯一名字，用于创建该caas instance的rc和svc
* caas instance的svc名字和rc名字保持一致
* caas instance的创建和删除，不用通过heat，由paas-api直接创建rc和svc。
* 创建caas_instance的API:
    - endpoint: /api/v1/caas_apps/{caas_app_name}/instances
    - method: POST
    - data: 
        ```
        {
            "kind": "CaasInstance",
            "name": "phpmyadmin-1",
            "svc_template": {
                ...
            },
            "rc_template": {
                ...
            }
        }
        ```
* 取得某个caas app下的所有instance
    - endpoint: /api/v1/caas_apps/{caas_app_name}/instances
    - method: GET
* 取得单个instance
    - endpoint: /api/v1/caas_apps/{caas_app_name}/instances/{instance_name}
    - method: GET
* 删除某个instance
    - endpoint: /api/v1/caas_apps/{caas_app_name}/instances/{instance_name}
    - method: DELETE
* 平台那边不用存放caas instance的json到数据库中。但是需要检测service的端口是否可用，而且需要和idevops一起考虑。


