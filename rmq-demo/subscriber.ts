import {connect} from "amqplib";

const run = async () => {
  try {
    const connection = await connect('amqp://localhost');
    const channel = await connection.createChannel();
    // создаём exchange под названием test с типом topic
    await channel.assertExchange('test', 'topic', {durable: true});
    const queue = await channel.assertQueue('my-cool-queue', {durable: true});
    // свяжем exchange и queue
    // queue.queue - получаем название очереди, даже если самоо названия нет
    await channel.bindQueue(queue.queue, 'test', 'my.command');
    // указываем, что канал потребляет сообщения с очереди и при получении
    // сообщения выводит его
    await channel.consume(queue.queue, (message) => {
      if (!message) {
        return;
      }
      console.log(message.content.toString());
      if (message.properties.replyTo) {
        // название очереди
        console.log(message.properties.replyTo);
        // отправка напрямую в очередь
        channel.sendToQueue(
          message.properties.replyTo,
          Buffer.from('Ответ'),
          {correlationId: message.properties.correlationId}
        );
      }
    }, {noAck: true});
  } catch (e) {
    console.error(e);
  }
};

run();
