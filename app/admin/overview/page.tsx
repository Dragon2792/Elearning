import styles from "./overview.module.css";

export default function AdminOverview() {
  return (
    <div className={styles.tableCard}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Field</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Field 1</td>
              <td>Value 1</td>
            </tr>
            <tr>
              <td>Field 2</td>
              <td>Value 2</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
