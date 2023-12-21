import * as THREE from "three";
import { llhxyz } from "./ge";

const coorTransMode = 1; // 转换模式 1： 距离 2： threejs 原生

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function distance(lat1, lon1, lat2, lon2) {
  const r = 6371; // 地球平均半径，单位为公里
  const deltaLon = toRadians(lon2 - lon1);
  const deltaLat = toRadians(lat2 - lat1);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(deltaLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = r * c * 10000;
  const dx = r * deltaLon * Math.cos(toRadians(lat1)) * 10000;
  const dy = r * deltaLat * 10000;
  return { dx: dx * 4.5, dy: dy * 1, distance };
}

function latLonToVector3(lat, lon, radius = 6371) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return {
    dx: x,
    dy: y,
  };
  return new THREE.Vector3(x, y, z);
}

var centerPoints = {};
var henanCenter = [106.334175108, 29.511784777];

function getCenter(longitude,latitude, radius = 6371){
  // const phi = (180 + longitude) * (Math.PI / 180);
  // const theta = (90 - latitude) * (Math.PI / 180);
  // return {
  //   x: -radius * Math.sin(theta) * Math.cos(phi),
  //   y: radius * Math.cos(theta),
  //   z: radius * Math.sin(theta) * Math.sin(phi),
  // }

  const theta = (90 + longitude) * (Math.PI / 180);
  const phi = (90 - latitude) * (Math.PI / 180);
  const sp = new THREE.Vector3().setFromSpherical(
  new THREE.Spherical(radius, phi, theta))
  return sp;
}
centerPoints = getCenter(henanCenter[0],henanCenter[1]);

export function lglt2xyz(lng, lat, radius = 6371) {
  const theta = (90 + lng) * (Math.PI / 180);
  const phi = (90 - lat) * (Math.PI / 180);
  const sp = new THREE.Vector3().setFromSpherical(
  new THREE.Spherical(radius, phi, theta))
  return {
    x: (sp.x - centerPoints.x) * 10000,
    y: (sp.y - centerPoints.y) * 10000,
    z: 0
  };

  // const phi = (180 + lng) * (Math.PI / 180);
  //   const theta = (90 - lat) * (Math.PI / 180);
  //   let px = -radius * Math.sin(theta) * Math.cos(phi);
  //   let py = radius * Math.cos(theta);
  //   let pz = radius * Math.sin(theta) * Math.sin(phi);
  //   console.log(px, py, pz, 'zzzzwww', centerPoints);
  //   return {
  //     x: -Number(((px-centerPoints.x)*1000)),
  //     y: Number(((py-centerPoints.y)*1000)),
  //     z: Number(0),
  //   }

  // const coord = llhxyz(lng, lat, 0)
  // return {
  //   x: coord[0],
  //   y: coord[1],
  //   z: coord[2]
  // }
}

function latLonToVector3WithOrigin(
  lat,
  lon,
  originLat,
  originLon,
  radius = 6371
) {
  // 将原点经纬度转换为threejs坐标
  const origin = latLonToVector3(originLat, originLon, radius);
  // 将目标经纬度转换为相对于原点的偏移量
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon - originLon) * Math.PI) / 180;
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  // 将偏移量加到原点的threejs坐标上
  // return origin.clone().add(new THREE.Vector3(x, y, z));
  return {
    dx: x + origin.dx,
    dy: y + origin.dy,
  };
}

/**
 * 道路、车道线、地理坐标转换为threejs的坐标
 * @param yuandian  原点位置
 * @param data 数据源
 */
export function coordinateTransform(yuandian, data, mode = coorTransMode) {
  let result = [];
  data.forEach((element) => {
    let obj = {
      type: element.geometry.type,
      coordinates: [],
    };
    element.geometry.coordinates.forEach((i) => {
      let arr = [];
      i.forEach((i) => {
        if (mode === 1) {
          let a = distance(yuandian[0], yuandian[1], i[0], i[1]);
          arr.push({
            x: a.dx,
            y: a.dy,
            z: 0,
          });
        } else if (mode === 2) {
          // threejs 原生球体方法 坐标转换
          const coor = lglt2xyz(i[0], i[1]);
          arr.push({
            x: coor.x,
            y: coor.y,
            z: coor.z || 0,
          });
        }
      });
      obj.coordinates.push(arr);
    });
    result.push(obj);
  });

  return result;
}

/**
 * 路边线等地理坐标转换为threejs的坐标 （linestring）
 * @param yuandian  原点位置
 * @param data 数据源
 */
export function coordinateLineTransform(yuandian, data, mode = coorTransMode) {
  let result = [];
  data.forEach((element) => {
    // console.log(element)
    let obj = {
      type: element.geometry.type,
      coordinates: [],
      properties: element.properties,
    };
    element.geometry.coordinates.forEach((i) => {
      if (mode === 1) {
        let a = distance(yuandian[0], yuandian[1], i[0], i[1]);
        obj.coordinates.push({
          x: a.dx,
          y: a.dy,
          z: 0,
        });
      } else if (mode === 2) {
        // threejs 原生球体方法 坐标转换
        const coor = lglt2xyz(i[0], i[1]);
        obj.coordinates.push({
          x: coor.x,
          y: coor.y,
          z: coor.z || 0,
        });
      }
    });
    result.push(obj);
  });

  return result;
}

/**
 * 轨迹地理坐标转换为threejs的坐标
 * 生成偏转角度和three 坐标
 * @param yuandian  原点位置
 * @param data 数据源
 */
export function carDataCoordinateTransform(
  yuandian,
  data,
  mode = coorTransMode
) {
  let result = [];
  data.map((i) => {
    // let a = distance(yuandian[0], yuandian[1], i.position[0], i.position[1]);
    // let a = latLonToVector3WithOrigin(
    //   i.position[0],
    //   i.position[1],
    //   yuandian[0],
    //   yuandian[1]
    // );
    // console.log(a, b, "aababbabab");
    if (mode === 1) {
      let a = distance(yuandian[0], yuandian[1], i.position[0], i.position[1]);
      i.position_three = [a.dx, a.dy];
    } else if (mode === 2) {
      // threejs 原生球体方法 坐标转换
      const coor = lglt2xyz(i.position[0], i.position[1]);
      i.position_three = [coor.x, coor.y];
      // arr.push({
      //   x: coor.x,
      //   y: coor.y,
      //   z: coor.z || 0
      // })
    }
    // i.position_three = [a.dx, a.dy];
  });
  let pro = data[0];
  result.push(pro);
  //去掉间隔时间很短的点  留下间隔大于200毫秒的点
  for (let i = 1; i < data.length; i++) {
    const cur = data[i];
    let timerjiange = cur.ts - pro.ts;
    if (i === data.length - 1) {
      result.push(cur);
      break;
    }
    if (timerjiange > 200) {
      result.push(cur);
      pro = cur;
    }
  }
  result[0].angle = 0;
  for (let i = 1; i < result.length; i++) {
    const pro = result[i - 1];
    const cur = result[i];
    var angle =
      Math.atan2(
        cur.position_three[1] - pro.position_three[1],
        cur.position_three[0] - pro.position_three[0]
      ) *
      (180 / Math.PI);
    // 修复偏转角度问题
    let pianyi = angle - pro.angle;
    if (pianyi > 90) {
      cur.angle = angle - 360;
    } else if (pianyi < -90) {
      cur.angle = angle + 360;
    } else {
      cur.angle = angle;
    }
    cur.timerjiange = cur.ts - pro.ts;
  }
  return result;
}
