# Aliyun oss support for loopback component storage
Add aliyun oss support for loopback
> [Aliyun OSS](https://www.alibabacloud.com/help/product/31815.htm?spm=a3c0i.7950270.1167928.3.2795ab91hyOWI7)

## Usage
`/server/datasources.json`:
```
{
  "storage": {
    "name": "storage",
    "connector": "@walkthechat/loopback-component-storage",
    "provider": "aliyun",
    "accessKeyId": "your key",
    "accessKeySecret": "your key secret",
    "bucket": "your bucket",
    "region": "your region"
  }
}
```
