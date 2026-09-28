const DataTree = ({ data }) => {
  function renderValue(value) {
    if (Array.isArray(value)) {
      return (
        <ul>
          {value.map((item, index) => {
            return <li key={index}>{renderValue(item)}</li>;
          })}
        </ul>
      );
    }

    if (value === null) {
      return <span>null</span>;
    }

    if (typeof value !== "object") {
      return <span>{value}</span>;
    }

    const keys = Object.keys(value);

    return (
      <ul>
        {keys.map((key) => {
          const childValue = value[key];
          return (
            <li key={key}>
              <strong>{key}</strong>
              {renderValue(childValue)}
            </li>
          );
        })}
      </ul>
    );
  }

  return <div>{renderValue(data)}</div>;
};

export default DataTree;
