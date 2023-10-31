declare module "highcharts" {
  interface Chart3dOptions {
    drag?: {
      enabled?: boolean;
      minAlpha?: number;
      maxAlpha?: number;
      minBeta?: number;
      maxBeta?: number;
      snap?: number;
      animateSnap?: boolean;
      speed?: number;
      flipAxes?: boolean;
      beforeDrag?: () => void;
      afterDrag?: () => void;
    };
  }
}
