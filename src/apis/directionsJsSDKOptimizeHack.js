/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { RouteData } from "../dataModel/routeData";
import { chunk, clone, pullAt } from "lodash";
let directionsService;

async function calcRoute(origin, destination, waypoints, travelMode, options) {
  if (!directionsService) {
    directionsService = new window.google.maps.DirectionsService();
  }

  let request = {
    origin: origin,
    destination: destination,
    travelMode: travelMode,
    avoidTolls: options.avoidTolls,
    avoidHighways: options.avoidHighways,
    optimizeWaypoints: !!options.optimizeWaypoints,
    waypoints: waypoints.map((wp) => {
      return {
        stopover: true,
        location: wp,
      };
    }),
  };
  let result;
  try {
    result = await directionsService.route(request);
  } catch (err) {
    console.log("gots error", err);
    if (err.code === "ZERO_RESULTS") {
      // ignore
      return;
    } else {
      throw err;
    }
  }
  return result;
}

function nearestNeighborIdx(point, wp) {
  let minDistance = Number.MAX_SAFE_INTEGER;
  let idx = 0;

  wp.forEach((p, n) => {
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
      p,
      point
    );
    if (distance < minDistance) {
      minDistance = distance;
      idx = n;
    }
  });
  return idx;
}

// XXX non-optimal w.r.t to final destination (ie final destination is never considered
// in the optimization problem.
function nearestNeighborSort(orig, inputWaypoints) {
  const waypoints = clone(inputWaypoints);
  let newWaypoints = [];
  let point = orig;
  do {
    console.log("finding nearest to", point);
    let idx = nearestNeighborIdx(point, waypoints);
    point = pullAt(waypoints, [idx])[0];
    console.log("nearest neighbor idx is", idx, point);
    newWaypoints.push(point);
  } while (waypoints.length > 0);
  console.log("inputWaypoints", inputWaypoints);
  console.log("newWaypoints", newWaypoints);
  return newWaypoints;
}

async function calcBigRoute(
  ultimateOrigin,
  ultimateDestination,
  ultimateWoypoints,
  travelMode,
  options
) {
  const timeBefore = Date.now();
  let waypoints;
  if (options.optimizeSLD) {
    waypoints = nearestNeighborSort(ultimateOrigin, ultimateWoypoints);
  } else {
    waypoints = clone(ultimateWoypoints);
  }
  waypoints.push(ultimateDestination);
  const waypointSplits = chunk(waypoints, options.chunks);
  console.log("gots chunks", options.chunks);
  let origin = ultimateOrigin;
  const routeResults = [];
  for (let n = 0; n < waypointSplits.length; n++) {
    const wpSplit = waypointSplits[n];
    const destination = wpSplit.pop();
    console.log(`${n} computing route between orig, dest`, origin, destination);
    const result = await calcRoute(
      origin,
      destination,
      wpSplit,
      travelMode,
      options
    );
    origin = destination;
    routeResults.push(result);
  }
  console.log("gots full result", routeResults);
  const timeAfter = Date.now();
  return RouteData.createFromHack(routeResults, timeAfter - timeBefore);
}

async function computeRoutesDirectionsJsSDKOptimizeHack(
  pairs,
  travelMode,
  options = {}
) {
  let pair;
  let paths = [];
  while ((pair = pairs.shift())) {
    try {
      const result = await calcBigRoute(
        pair.origin,
        pair.destination,
        pair.waypoints,
        travelMode,
        options
      );
      await new Promise((r) => setTimeout(r, 400));
      if (result) {
        // sometimes there aren't routes
        paths.push(result);
      }
    } catch (err) {
      alert(`${err.name}: ${err.message}`);
      return paths;
    }
  }
  return paths;
}

export { computeRoutesDirectionsJsSDKOptimizeHack };
