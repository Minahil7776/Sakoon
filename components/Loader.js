import "./Loader.css";

export default function Loader({ text = "Please wait..." }) {
  return (
    <div className="loader-container">
      <img
        src="/ambulance-loader.gif"
        alt="Loading..."
        className="ambulance-loader"
      />
      <p>{text}</p>
    </div>
  );
}
