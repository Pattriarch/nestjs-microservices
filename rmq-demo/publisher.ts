import {connect} from "amqplib";

const run = async () => {
  try {
    const connection = await connect('amqp://localhost');
    const channel = await connection.createChannel();
    await channel.assertExchange('test', 'topic', {durable: true});
    // даём rabbitmq самому создавать уникальное название очереди
    // exclusive - может подключиться лишь один consumer и очередь будет удалена после использования
    const replyQueue = await channel.assertQueue('', {exclusive: true});
    channel.consume(replyQueue.queue, (message) => {
      console.log(message?.content.toString());
      console.log(message?.properties.correlationId);
    }, { noAck: true })
    channel.publish(
      'test', 'my.command', Buffer.from('Это работает!'),
      // correlationId должен как-то уникальное генерироваться сам (мб uuid)
      {replyTo: replyQueue.queue, correlationId: '1'}
    );
  } catch (e) {
    console.error(e);
  }
};

run();
