import classes from "./loader.module.css"

export default function Loader({ size = '40px' }) {
  return (
    <div style={{ width: size, height: size, display: 'flex', justifyContent: 'center', alignItems:'center' }}>
    <div className={classes.loader} style={{ width: '65%', height: '65%' }}></div>
  </div>
  );
}
