// This function is used to parse the date and time into a human readable format from the timestamp.
export default function timestampConverter(UNIX_timestamp) {
  const a = new Date(UNIX_timestamp * 1000);
  const year = a.getFullYear();
  const month = a.getMonth() + 1;
  const date = a.getDate();
  const hour = a.getHours();
  const min = (a.getMinutes() < 10 ? '0' : '') + a.getMinutes();
  //const sec = a.getSeconds();
  const time = year + '/' + month + '/' + date + ' ' + hour + ':' + min;
  return time;
}
